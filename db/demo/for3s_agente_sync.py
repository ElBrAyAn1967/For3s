#!/usr/bin/env python3
"""
for3s-agente-sync · el lector del modelo C (Brian 2026-07-26).

QUÉ HACE
  Cada CICLO_SEG consulta Neon: "¿qué agentes deberían estar encendidos?"
  (demo_users.agent_on del DUEÑO de cada instancia 1:1) y lo compara con la
  realidad (`docker ps`). Si difieren, aplica `for3s encender|apagar`.

POR QUÉ ASÍ (y no un endpoint expuesto)
  El mini-agente for3s-ctl vive en :8443/ctl, TAILNET-ONLY a propósito (plano admin
  del diseño dual-plane R10). Vercel está en internet. Exponer /ctl al Funnel
  habría puesto el control de contenedores al alcance de un token filtrado.
  Aquí el flujo se INVIERTE: nadie entra desde fuera; este proceso, que ya corre
  DENTRO del server, sale a leer su propia BD. La superficie de ataque no crece.

QUIÉN MANDA
  SOLO el dueño de la instancia (demo_duenos). El endpoint web ya lo exige, y esta
  consulta lo vuelve a exigir: si la fila no es del dueño, se ignora. Defensa en
  profundidad — el server no confía en que la web haya filtrado bien.

LÍMITES DE SEGURIDAD (deliberados, no olvidos)
  · Solo instancias con modo '1:1'. general (1:M) NUNCA se toca.
  · foresito jamás: no está en demo_instancias (es la nave nodriza, va por terminal).
  · Solo encender/apagar. NUNCA borrar, crear ni tocar volúmenes.

INSTALACIÓN (en el server for3s)
    sudo cp for3s_agente_sync.py /usr/local/bin/for3s-agente-sync
    sudo chmod +x /usr/local/bin/for3s-agente-sync
    # DEMO_DATABASE_URL en /etc/for3s-agente-sync.env (chmod 600, root)
    # ⭐ y el TIMBRE (EXT-74), para que Neon pueda dormir — las dos o ninguna:
    #   FOR3S_SYNC_BELL_REST_URL=https://<base de Upstash>   FOR3S_SYNC_BELL_REST_TOKEN=<su token REST>
    #   opcionales: FOR3S_SYNC_BELL_KEY (demo-bell:for3s) · FOR3S_SYNC_RED_SEG (21600 = cada 6 h)
    sudo systemctl enable --now for3s-agente-sync
  Unidad systemd de ejemplo al pie de este archivo.
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

try:
    import psycopg
except ImportError:
    sys.exit("falta psycopg: pip install 'psycopg[binary]'")

CICLO_SEG = int(os.environ.get("FOR3S_SYNC_CICLO_SEG", "10"))
DB_URL = os.environ.get("DEMO_DATABASE_URL")

# ── EL TIMBRE (EXT-74, Brian 2026-11-03) ─────────────────────────────────────
# Preguntar a Neon cada 10 s no la deja dormir nunca: la rama principal de la Demo
# estuvo despierta 396 h en octubre ≈ 99 de las 100 CU-h del plan Free (medido por
# la API de Neon). Con el timbre, este proceso espera en Upstash —Neon dormida— y lee
# la BD solo cuando la web avisa (lib/demo/timbre.ts), al arrancar, y cada RED_SEG
# como red de seguridad por si un timbre se perdió. Sin las dos variables del timbre,
# sigue preguntando cada CICLO_SEG como antes.
BELL_URL = os.environ.get("FOR3S_SYNC_BELL_REST_URL", "").strip().rstrip("/")
BELL_TOKEN = os.environ.get("FOR3S_SYNC_BELL_REST_TOKEN", "").strip()
BELL_KEY = os.environ.get("FOR3S_SYNC_BELL_KEY", "demo-bell:for3s").strip()
BELL_WAIT = 50   # segundos que bloquea un BLPOP — medido: Upstash REST aguanta 55 s
RED_SEG = int(os.environ.get("FOR3S_SYNC_RED_SEG", str(6 * 3600)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("agente-sync")

# La intención: qué agentes quiere el DUEÑO encendidos.
# Se cruza demo_users con demo_duenos para que solo cuente la fila del dueño —
# la de un invitado no decide nada, aunque tuviera agent_on.
SQL_DESEADO = """
    SELECT u.instancia, u.agent_on
    FROM demo_users u
    JOIN demo_duenos d
      ON d.instancia = u.instancia AND lower(d.email) = lower(u.email)
    JOIN demo_instancias i
      ON i.instancia = u.instancia
    WHERE i.modo = '1:1' AND i.activa
"""


def encendidas_ahora() -> set[str]:
    """Instancias cuyo contenedor agent está corriendo (la realidad)."""
    try:
        out = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True, text=True, timeout=20, check=True,
        ).stdout
    except (subprocess.SubprocessError, OSError) as e:
        log.warning("no pude leer docker ps: %s", e)
        return set()
    # nombres tipo for3s-<inst>-agent-1
    vivas = set()
    for linea in out.splitlines():
        p = linea.strip().split("-")
        if len(p) >= 3 and p[0] == "for3s" and p[-2] == "agent":
            vivas.add("-".join(p[1:-2]))
    return vivas


def aplicar(instancia: str, encender: bool) -> bool:
    """Ejecuta el gestor `for3s`. Solo encender/apagar; nada destructivo."""
    accion = "encender" if encender else "apagar"
    log.info("aplicando: %s %s", accion, instancia)
    try:
        r = subprocess.run(
            ["for3s", accion, instancia],
            capture_output=True, text=True, timeout=300,
        )
        if r.returncode != 0:
            log.error("`for3s %s %s` falló (%s): %s",
                      accion, instancia, r.returncode, r.stderr.strip()[:300])
            return False
        log.info("✅ %s %s", accion, instancia)
        return True
    except subprocess.SubprocessError as e:
        log.error("error ejecutando `for3s %s %s`: %s", accion, instancia, e)
        return False


def un_ciclo(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(SQL_DESEADO)
        deseado = {inst: bool(on) for inst, on in cur.fetchall()}
    if not deseado:
        return

    vivas = encendidas_ahora()
    for instancia, quiere_on in deseado.items():
        esta_on = instancia in vivas
        if quiere_on == esta_on:
            continue  # ya coincide: nada que hacer
        log.info("desajuste en '%s': BD dice %s, docker dice %s",
                 instancia, "ON" if quiere_on else "OFF", "ON" if esta_on else "OFF")
        aplicar(instancia, quiere_on)


def esperar_timbre(url: str, token: str, llave: str, segundos: int = BELL_WAIT) -> bool:
    """Bloquea hasta que la web toque el timbre o pasen `segundos`. True = sonó.
    El timbre no trae nada en lo que se confíe: solo dice "lee la BD ahora".
    Un error de Upstash LANZA: nunca pasa por timbre sonado ni por silencio."""
    req = urllib.request.Request(
        url, data=json.dumps(["BLPOP", llave, str(segundos)]).encode(), method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=segundos + 15) as r:
        out = json.loads(r.read())
    if not isinstance(out, dict) or "error" in out:
        raise OSError(f"error del timbre: {str(out.get('error') if isinstance(out, dict) else out)[:80]}")
    res = out.get("result")
    return isinstance(res, list) and len(res) == 2


def leer_y_aplicar() -> None:
    """Una lectura de Neon + aplicar desajustes. Una conexión por lectura, como siempre."""
    with psycopg.connect(DB_URL, connect_timeout=15) as conn:
        un_ciclo(conn)


def bucle_con_timbre(esperar, leer, reloj=time.monotonic, dormir=time.sleep, vueltas=None) -> None:
    """Lee al arrancar; después solo cuando suena el timbre o vence la red de seguridad.
    `vueltas` existe para las pruebas: None = para siempre."""
    ultima = None
    fallos = 0
    n = 0
    while vueltas is None or n < vueltas:
        n += 1
        if ultima is None or reloj() - ultima >= RED_SEG:
            motivo = "arranque" if ultima is None else "red de seguridad"
        else:
            try:
                sono = esperar()
                fallos = 0
                if not sono:
                    continue  # nadie tocó: Neon sigue dormida
            except (OSError, ValueError, urllib.error.URLError) as e:
                # Espera creciente, tope 5 min: reintentar cada 5 s contra un Upstash que rechaza son
                # ~518 mil peticiones al mes y el plan Free da 500 mil (medido 2026-11-03). Mientras
                # tanto, la red de seguridad sigue leyendo Neon cada RED_SEG.
                espera = min(300, 5 * 2 ** fallos)
                fallos += 1
                log.warning("timbre inalcanzable (%s) — reintento en %s s", type(e).__name__, espera)
                dormir(espera)
                continue
            motivo = "timbre"
        try:
            leer()
            log.info("lectura de Neon (%s)", motivo)
        except Exception as e:  # noqa: BLE001 — el bucle NUNCA debe morir
            log.warning("lectura falló (%s): %s", motivo, e)
        ultima = reloj()  # también tras un fallo: si Neon cae, no se martillea cada vuelta


def main() -> None:
    if not DB_URL:
        sys.exit("falta DEMO_DATABASE_URL")
    if bool(BELL_URL) != bool(BELL_TOKEN):
        sys.exit("FOR3S_SYNC_BELL_REST_URL y FOR3S_SYNC_BELL_REST_TOKEN van juntas: las dos o ninguna")
    if BELL_URL:
        if not BELL_URL.startswith("https://"):
            sys.exit("FOR3S_SYNC_BELL_REST_URL debe ser https://")
        log.info("for3s-agente-sync arrancado (timbre %s · red cada %ss)", BELL_KEY, RED_SEG)
        bucle_con_timbre(lambda: esperar_timbre(BELL_URL, BELL_TOKEN, BELL_KEY), leer_y_aplicar)
        return
    log.info("for3s-agente-sync arrancado (ciclo %ss, sin timbre)", CICLO_SEG)
    while True:
        try:
            # Conexión por ciclo: si Neon corta, el siguiente ciclo reconecta solo.
            with psycopg.connect(DB_URL, connect_timeout=15) as conn:
                un_ciclo(conn)
        except Exception as e:  # noqa: BLE001 — el bucle NUNCA debe morir
            log.warning("ciclo falló (se reintenta): %s", e)
        time.sleep(CICLO_SEG)


if __name__ == "__main__":
    main()

# ─────────────────────────────────────────────────────────────────────────────
# /etc/systemd/system/for3s-agente-sync.service
#
# [Unit]
# Description=For3s · sincroniza agent_on (Neon) con los contenedores
# After=network-online.target docker.service
# Wants=network-online.target
#
# [Service]
# Type=simple
# User=brianweb3                      # necesita estar en el grupo docker
# EnvironmentFile=/etc/for3s-agente-sync.env
# ExecStart=/usr/local/bin/for3s-agente-sync
# Restart=always
# RestartSec=5
#
# [Install]
# WantedBy=multi-user.target
# ─────────────────────────────────────────────────────────────────────────────
