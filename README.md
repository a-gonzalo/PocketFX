# PocketFX

PocketFX es un framework SPA inspirado en JavaFX/FXML. Esta carpeta contiene el código fuente y un bundle listo para ser importado en otros proyectos.

## Uso como paquete local o npm

1. Desde otro proyecto con npm/yarn puedes instalarlo desde el repositorio git:

   ```bash
   npm install git+ssh://git@github.com/a-gonzalo/PocketFX.git
   # o utilizando HTTPS
   npm install https://github.com/a-gonzalo/PocketFX.git
   ```

   El paquete exporta los elementos principales (`PocketFX`, `SceneManager`, `Stage`, etc.).

2. Si prefieres usarlo como submódulo, añade este repositorio y enlaza a `src/` o incluso copia `build/`.

3. Para consumir el bundle directamente en navegador sin build step, enlaza el archivo UMD:

   ```html
   <script src="/path/to/pocketfx/build/pocketfx.umd.js"></script>
   <script>
     const { SceneManager, Stage } = PocketFX;
   </script>
   ```

4. Para importar módulos ESM en un proyecto con bundler/Babel:

   ```js
   import { SceneManager, PocketFX } from 'pocketfx';
   // o import desde el bundle local
   import { SceneManager } from './node_modules/pocketfx/build/pocketfx.esm.js';
   ```

## Generar el bundle

Para regenerar o modificar el paquete se usa Rollup. El código fuente está en `src/` y el punto de entrada es `src/index.js`.

```bash
npm install        # instala devdeps
npm run build      # crea/actualiza la carpeta build/
```

El directorio `build/` contiene:

* `pocketfx.esm.js` (formato ES modules)
* `pocketfx.cjs.js` (CommonJS)
* `pocketfx.umd.js` (UMD para navegador)
* archivos `.map` de sourcemap

## Registro y publicación

- El paquete está configurado para publicarse en npm bajo el nombre `pocketfx`.
- Antes de publicar, ejecutar `npm run build` ya que hay un hook `prepublishOnly`.

## Nota sobre PocketBase

La librería no incluye una instancia de PocketBase. La aplicación cliente debe
registrarla manualmente:

```js
import PocketBase from 'pocketbase';
import { PocketFX } from 'pocketfx';

const pb = new PocketBase('https://....');
PocketFX.registerService('pb', pb);
```

Se mantiene la compatibilidad con la propiedad global `pb` si existe, pero
no se exporta ni se importa desde el paquete.
