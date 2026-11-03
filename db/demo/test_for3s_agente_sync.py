"""for3s-agente-sync con TIMBRE (EXT-74): cuándo lee Neon y cuándo la deja dormir.

    python3 -m unittest db/demo/test_for3s_agente_sync.py

Sin red ni BD: el bucle recibe funciones falsas para esperar, leer, el reloj y dormir;
`esperar_timbre` se prueba contra un Upstash falso en loopback.
"""
import importlib.util
import json
import os
import sys
import threading
import types
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

# psycopg no hace falta para estas pruebas; si no está instalado, un módulo vacío basta
sys.modules.setdefault("psycopg", types.ModuleType("psycopg"))
_spec = importlib.util.spec_from_file_location("agente_sync", Path(__file__).parent / "for3s_agente_sync.py")
s = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(s)


class Reloj:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class Bucle(unittest.TestCase):
    def correr(self, respuestas, vueltas, reloj=None, leer=None):
        """`respuestas`: lo que devuelve esperar() en cada llamada (bool, o una excepción)."""
        self.lecturas, self.dormidas, self.esperas = 0, [], 0
        cola = list(respuestas)

        def esperar():
            self.esperas += 1
            r = cola.pop(0) if cola else False
            if isinstance(r, Exception):
                raise r
            return r

        def leer_falso():
            self.lecturas += 1

        s.bucle_con_timbre(esperar, leer or leer_falso, reloj=reloj or Reloj(),
                           dormir=self.dormidas.append, vueltas=vueltas)

    def test_lee_al_arrancar_y_despues_deja_dormir_a_neon(self):
        self.correr([False] * 10, vueltas=10)
        self.assertEqual(self.lecturas, 1)      # solo el arranque
        self.assertEqual(self.esperas, 9)       # el resto, esperando el timbre

    def test_cada_timbre_es_una_lectura(self):
        self.correr([False, True, False, True], vueltas=5)
        self.assertEqual(self.lecturas, 3)      # arranque + 2 timbres

    def test_la_red_de_seguridad_lee_sin_timbre_al_vencer(self):
        reloj = Reloj()
        orig = s.bucle_con_timbre

        def esperar():
            reloj.t += s.RED_SEG / 2 + 1        # cada espera avanza más de media red
            return False
        lecturas = []
        orig(esperar, lambda: lecturas.append(reloj.t), reloj=reloj, dormir=lambda _: None, vueltas=7)
        # arranque (vuelta 1), y una lectura cada vez que pasan ≥ RED_SEG sin timbre: dos esperas
        # de media red + 1 s la vencen, así que leen las vueltas 4 y 7
        self.assertEqual(len(lecturas), 3)
        self.assertTrue(all(b - a >= s.RED_SEG for a, b in zip(lecturas, lecturas[1:])))

    def test_un_error_del_timbre_espera_5_s_y_no_lee(self):
        self.correr([OSError("caído"), False], vueltas=3)
        self.assertEqual(self.lecturas, 1)      # solo el arranque: un error NO es un timbre
        self.assertEqual(self.dormidas, [5])

    def test_errores_seguidos_del_timbre_esperan_cada_vez_mas_hasta_5_min(self):
        # cada 5 s fijos contra un Upstash que rechaza = ~518 mil peticiones/mes > 500 mil del plan Free
        self.correr([OSError("x")] * 9 + [False, OSError("x")], vueltas=12)
        self.assertEqual(self.dormidas[:9], [5, 10, 20, 40, 80, 160, 300, 300, 300])
        self.assertEqual(self.dormidas[9], 5)   # un timbre que respondió reinicia la espera

    def test_si_neon_falla_el_bucle_sigue_y_no_la_martillea(self):
        fallos = []

        def leer_roto():
            fallos.append(1)
            raise RuntimeError("neon caída")
        self.correr([False, False, False], vueltas=4, leer=leer_roto)
        self.assertEqual(len(fallos), 1)        # falló el arranque y NO reintenta cada vuelta


class Timbre(unittest.TestCase):
    """esperar_timbre contra un Upstash falso: cuerpo del BLPOP, bearer y las tres respuestas."""

    def setUp(self):
        self.vistos, self.respuesta = [], {"result": ["demo-bell:for3s", "agent_on"]}
        prueba = self

        class H(BaseHTTPRequestHandler):
            def do_POST(self):
                largo = int(self.headers["Content-Length"])
                prueba.vistos.append((self.headers["Authorization"], json.loads(self.rfile.read(largo))))
                cuerpo = json.dumps(prueba.respuesta).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(cuerpo)))
                self.end_headers()
                self.wfile.write(cuerpo)

            def log_message(self, *a):
                pass

        self.srv = HTTPServer(("127.0.0.1", 0), H)
        threading.Thread(target=self.srv.serve_forever, daemon=True).start()
        self.url = f"http://127.0.0.1:{self.srv.server_port}"

    def tearDown(self):
        self.srv.shutdown()
        self.srv.server_close()

    def test_sono(self):
        self.assertTrue(s.esperar_timbre(self.url, "tok", "demo-bell:for3s", 3))
        self.assertEqual(self.vistos[0], ("Bearer tok", ["BLPOP", "demo-bell:for3s", "3"]))

    def test_nadie_toco(self):
        self.respuesta = {"result": None}
        self.assertFalse(s.esperar_timbre(self.url, "tok", "k", 1))

    def test_un_error_de_upstash_lanza_nunca_pasa_por_timbre(self):
        self.respuesta = {"error": "WRONGPASS invalid password"}
        with self.assertRaises(OSError):
            s.esperar_timbre(self.url, "tok", "k", 1)

    def test_la_llave_por_omision_es_la_que_toca_la_web(self):
        # contrato con lib/demo/timbre.ts → llaveTimbre("for3s")
        self.assertEqual(s.BELL_KEY, os.environ.get("FOR3S_SYNC_BELL_KEY", "demo-bell:for3s"))
        self.assertEqual(s.BELL_KEY, "demo-bell:for3s")


class ArranqueSeguro(unittest.TestCase):
    def test_medio_timbre_configurado_no_arranca(self):
        viejo = (s.DB_URL, s.BELL_URL, s.BELL_TOKEN)
        try:
            s.DB_URL, s.BELL_URL, s.BELL_TOKEN = "postgresql://x@db.example.test/x", "https://t.example.test", ""
            with self.assertRaises(SystemExit):
                s.main()
            s.BELL_URL, s.BELL_TOKEN = "http://t.example.test", "tok"
            with self.assertRaises(SystemExit):
                s.main()                         # sin https el token viajaría en claro
        finally:
            s.DB_URL, s.BELL_URL, s.BELL_TOKEN = viejo


if __name__ == "__main__":
    unittest.main()
