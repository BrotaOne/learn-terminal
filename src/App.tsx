import { useCallback, useEffect, useRef } from 'react'
import { Terminal }  from 'xterm'
import './App.css'
import 'xterm/css/xterm.css'

const TermColors = {
  Red: "\x1B[1;31m",
  Green: "\x1B[1;32m",
  Purple: "\x1B[1;35m",
  Reset: "\x1B[0m",
};
const PROMPT = ` Hello from ${TermColors.Red}xterm.js${TermColors.Reset}  $ `;
const genPrompt = (terminal: Terminal) => {
  terminal.writeln(PROMPT)
  terminal.write(`${TermColors.Green} > ${TermColors.Reset}`)
}

function App() {
  const input = useRef('')
  const instance = useRef<Terminal>(null)

  const runCommand = useCallback(
    () => {
      if (!instance.current) {
        return
      }
      const terminal = instance.current;
      switch (input.current.trim()) {
        case 'clear':
          terminal.clear()
          break
        case 'help':
          terminal.writeln(' Available commands:')
          terminal.writeln(` ${TermColors.Green}ls clear help${TermColors.Reset}`)
          break
        default:
          if (!input.current) {
            break
          }
          instance.current.writeln(` You entered: ${input.current}`)
          break
      }

      input.current = ''
    }, [instance]
  )

  useEffect(
    () => {
      const terminal = new Terminal({
        tabStopWidth: 4,
      })
      instance.current = terminal

      const container = document.getElementById('terminal')
      if (!container) {
        return
      }

      terminal.open(container)
      terminal.writeln('')
      terminal.writeln(' Welcome \x1B[1;33mto\x1B[0m use xterm.js!')
      terminal.writeln('')
      genPrompt(terminal)
   
      terminal.onKey(event => {
        const code = event.domEvent.code
        console.log('code: ', code)

        switch (code) {
          case 'Enter':
            terminal.writeln('')
            runCommand()
            genPrompt(terminal)
            break
          case 'Backspace':
            if (input.current.length > 0) {
              terminal.write('\b \b')
              input.current = input.current.slice(0, -1)
            }
            break
          case 'Tab': {
              terminal.write(event.key)
              const length = 4 - (input.current.length + 3)%4
              input.current += Array(length).fill(' ').join('')
              break;
          }
          default:
            terminal.write(event.key)
            input.current += event.key
        }
      })

      return () => {
        input.current = ''
        terminal.dispose()
      }
    },
    [runCommand]
  )

  return (
    <>
      <div id="terminal" />
    </>
  )
}

export default App
