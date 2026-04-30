const modeLoaders = {
  apache: () => import('./custom/modes/apache.js'),
  clike: () => import('codemirror/mode/clike/clike.js'),
  clojure: () => import('codemirror/mode/clojure/clojure.js'),
  cobol: () => import('codemirror/mode/cobol/cobol.js'),
  coffeescript: () => import('codemirror/mode/coffeescript/coffeescript.js'),
  commonlisp: () => import('codemirror/mode/commonlisp/commonlisp.js'),
  crystal: () => import('codemirror/mode/crystal/crystal.js'),
  css: () => import('codemirror/mode/css/css.js'),
  d: () => import('codemirror/mode/d/d.js'),
  dart: () => import('codemirror/mode/dart/dart.js'),
  diff: () => import('codemirror/mode/diff/diff.js'),
  django: () => import('codemirror/mode/django/django.js'),
  dockerfile: () => import('codemirror/mode/dockerfile/dockerfile.js'),
  elixir: () => import('./custom/modes/elixir.js'),
  elm: () => import('codemirror/mode/elm/elm.js'),
  erlang: () => import('codemirror/mode/erlang/erlang.js'),
  fortran: () => import('codemirror/mode/fortran/fortran.js'),
  gherkin: () => import('codemirror/mode/gherkin/gherkin.js'),
  go: () => import('codemirror/mode/go/go.js'),
  graphql: () => import('./custom/modes/graphql.js'),
  groovy: () => import('codemirror/mode/groovy/groovy.js'),
  handlebars: () => import('codemirror/mode/handlebars/handlebars.js'),
  haskell: () => import('codemirror/mode/haskell/haskell.js'),
  htmlmixed: () => import('codemirror/mode/htmlmixed/htmlmixed.js'),
  javascript: () => import('codemirror/mode/javascript/javascript.js'),
  jsx: () => import('codemirror/mode/jsx/jsx.js'),
  julia: () => import('codemirror/mode/julia/julia.js'),
  lua: () => import('codemirror/mode/lua/lua.js'),
  markdown: () => import('codemirror/mode/markdown/markdown.js'),
  mathematica: () => import('codemirror/mode/mathematica/mathematica.js'),
  mllike: () => import('codemirror/mode/mllike/mllike.js'),
  nginx: () => import('codemirror/mode/nginx/nginx.js'),
  nim: () => import('./custom/modes/nim.js'),
  ntriples: () => import('codemirror/mode/ntriples/ntriples.js'),
  octave: () => import('codemirror/mode/octave/octave.js'),
  pascal: () => import('codemirror/mode/pascal/pascal.js'),
  perl: () => import('codemirror/mode/perl/perl.js'),
  php: () => import('codemirror/mode/php/php.js'),
  powershell: () => import('codemirror/mode/powershell/powershell.js'),
  protobuf: () => import('codemirror/mode/protobuf/protobuf.js'),
  python: () => import('codemirror/mode/python/python.js'),
  r: () => import('codemirror/mode/r/r.js'),
  riscv: () => import('./custom/modes/riscv.js'),
  ruby: () => import('codemirror/mode/ruby/ruby.js'),
  rust: () => import('codemirror/mode/rust/rust.js'),
  sass: () => import('codemirror/mode/sass/sass.js'),
  shell: () => import('codemirror/mode/shell/shell.js'),
  smalltalk: () => import('codemirror/mode/smalltalk/smalltalk.js'),
  solidity: () => import('./custom/modes/solidity.js'),
  sparql: () => import('codemirror/mode/sparql/sparql.js'),
  sql: () => import('codemirror/mode/sql/sql.js'),
  stex: () => import('codemirror/mode/stex/stex.js'),
  stylus: () => import('codemirror/mode/stylus/stylus.js'),
  swift: () => import('codemirror/mode/swift/swift.js'),
  tcl: () => import('codemirror/mode/tcl/tcl.js'),
  toml: () => import('codemirror/mode/toml/toml.js'),
  turtle: () => import('codemirror/mode/turtle/turtle.js'),
  twig: () => import('codemirror/mode/twig/twig.js'),
  vb: () => import('codemirror/mode/vb/vb.js'),
  verilog: () => import('codemirror/mode/verilog/verilog.js'),
  vhdl: () => import('codemirror/mode/vhdl/vhdl.js'),
  vue: () => import('codemirror/mode/vue/vue.js'),
  xquery: () => import('codemirror/mode/xquery/xquery.js'),
  yaml: () => import('codemirror/mode/yaml/yaml.js'),
}

const loadedModes = new Set(['auto', 'text'])
const loadingModes = new Map()
let addonsPromise = null

function ensureCodeMirrorAddons() {
  if (!addonsPromise) {
    addonsPromise = Promise.all([
      import('./custom/autoCloseBrackets'),
      import('cm-show-invisibles'),
    ])
  }

  return addonsPromise
}

export function isCodeMirrorModeLoaded(mode) {
  return !mode || loadedModes.has(mode)
}

export async function ensureCodeMirrorMode(mode) {
  await ensureCodeMirrorAddons()

  if (isCodeMirrorModeLoaded(mode)) {
    return
  }

  const existingLoad = loadingModes.get(mode)

  if (existingLoad) {
    return existingLoad
  }

  const loadMode = modeLoaders[mode]

  if (!loadMode) {
    loadedModes.add(mode)
    return
  }

  const modeLoad = loadMode()
    .then(() => {
      loadedModes.add(mode)
    })
    .finally(() => {
      loadingModes.delete(mode)
    })

  loadingModes.set(mode, modeLoad)

  return modeLoad
}
