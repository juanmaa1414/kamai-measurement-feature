# Kamai — Prueba técnica

Material de la prueba técnica de Kamai: especificación en formato OpenSpec y muestra visual del dashboard.

Además, hay un documento provisional con las decisiones que yo fui pensando y buscando posibles mejores alternativas, ya sea googleando, viendo casos similares, y también conversando con el agente. Todo analizando anteriormente antes de iniciar OpenSpec: [draft_decisions_español.md](draft_decisions_español.md) así este ya podía trabajar en las specs con menos dudas y menos ambigüedades.

## Levantar la muestra con un comando

```bash
cd sample
docker compose up -d
```

La app queda servida en **http://localhost:3210**. La primera vez tarda unos segundos: el `Dockerfile` instala `node_modules` adentro del contenedor, así que la máquina host no necesita nada.

Para detenerla:

```bash
cd sample
docker compose down
```

Si el puerto 3210 ya está ocupado en tu máquina, cambia la línea `ports:` en `sample/docker-compose.yml` por otro.