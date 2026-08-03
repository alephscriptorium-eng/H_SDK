# BACKLOG (fixture SINTÉTICA) — tercera cara VÁLIDA: `deps` en prosa

En una herramienta en castellano, unir dos dependencias con «y» —o anotar entre
paréntesis de qué ola vienen— es lo que escribe quien la usa. El contrato
declara la holgura (§1) y el linter la acepta: separadores naturales,
puntuación de prosa, paréntesis y enlaces markdown. La prosa se ignora
—palabras **y números sueltos**—; solo se caza el token que **mezcla letras y
dígitos** sin ser un ID legible (`dep-no-interpretable`), que es la forma de un
ID roto.

## Lane A · ALFA

| WP | P | BRIEF | CA | deps | ejes |
| -- | - | ----- | -- | ---- | ---- |
| **FX-A01** | P0 | extraer el kit de plantillas a un paquete propio | el probe del consumidor sintetico resuelve la plantilla con exit 0 | Ninguna. | I |
| **FX-A02** | P1 | cablear el kit en el adaptador de entrada | grep del simbolo devuelve 1 definicion en el adaptador | ninguna (WP raiz del carril) | II |
| **FX-A03** | P1 | publicar la cara publica del kit de plantillas | el script de ceguera imprime `ceguera: 0` en arbol e historial | FX-A01 y FX-A02 | ceguera |
| **FX-A04** | P2 | segundo cliente independiente del contrato | la suite del segundo cliente pasa en verde sin tocar al primero | [FX-A01](#fx-a01); FX-A03. | IV |
| **FX-A05** | P2 | migrar el adaptador viejo al kit nuevo | dos ejecuciones dejan el arbol igual (idempotente) | FX-A01, FX-A03 (ambas de la ola 1) | II |
| **FX-A06** | P2 | cerrar el acceso sin rol declarado | ningun usuario sin rol puede abrir la sala | ninguna (raiz de la ola 2) | hostil-omite |
| **FX-A07** | P2 | documentar el contrato de la region | el gate de docs pasa en verde | FX-A01 (ver seccion 3) | ceguera |
