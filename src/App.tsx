import { useCallback, useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import './App.css'
import '@xterm/xterm/css/xterm.css'
import useNode, { closeIframe } from './useNode'

const TermColors = {
  Red: "\x1B[1;31m",
  Green: "\x1B[1;32m",
  Purple: "\x1B[1;35m",
  Yellow: "\x1B[1;33m",
  Reset: "\x1B[0m",
}
const PROMPT = ` Hello from ${TermColors.Red}xterm.js${TermColors.Reset}  $ `
const genPrompt = (terminal: Terminal) => {
  terminal.writeln(PROMPT)
  terminal.write(`${TermColors.Green} > ${TermColors.Reset}`)
}

function App() {
  const input = useRef('')
  const instance = useRef<Terminal>(null)
 
  const exitServer = useRef<null | (() => void)>(null)
  const [, setState] = useState(0)
  const forceUpdate = useCallback(
    () => setState(v => v + 1),
    [setState]
  )

  const status = useRef<1 | 2>(1)

  const write = useCallback(
    (data: string) => {
      if (instance.current) {
        instance.current.write(data)
      }  
    },
    []
  )

  const nodeCommand = useNode(write, instance)


  const closeServer = useCallback(
    () => {
      if (exitServer.current) {
        exitServer.current()
        exitServer.current = null
        closeIframe()
        forceUpdate()
      } else {
        return 'no runing server'
      }
    },
    [exitServer, forceUpdate]
  )

  const runCommand = useCallback(
    async () => {
      if (!instance.current) {
        return
      }
      const terminal = instance.current
      const commands = input.current.trim().split(' ')
      try {
        switch (commands[0]) {
          case 'clear':
            terminal.clear()
            break
          case 'help':
            terminal.writeln(' Available commands:')
            terminal.writeln(` ${TermColors.Green}ls clear help mkdir rmdir openServer closeServer jsh${TermColors.Reset}`)
            break
          case 'ls': {
            const result = await nodeCommand.ls(commands[1])
           
            const files = result.map(v => {
              if (v.isDir) {
                return `${TermColors.Green}${v.name}${TermColors.Reset}`
              }
              return v.name
            })
            terminal.writeln(' ' + files.join(' '))
            break
          }
          case 'mkdir': {
            await nodeCommand.mkdir(commands[1])
            break
          }
          case 'rmdir': {
            await nodeCommand.rmdir(commands[1])
            break
          }
          case 'openServer': {
            const exit = await nodeCommand.openServer()
            exitServer.current = exit
            forceUpdate()
            break
          }
          case 'closeServer': {
            const msg = closeServer()
            if (msg) {
              terminal.writeln(` ${TermColors.Red}${msg}${TermColors.Reset}`)
              terminal.writeln('')
            }
            break
          }
          case 'jsh': {
            const inputStream = await nodeCommand.jsh()
            status.current = 2
            let isExit = false
            instance.current!.onData(data => {
              if (data.charCodeAt(0) === 13 && isExit) {
                status.current = 1
                inputStream.close()
                terminal.writeln('')
                genPrompt(terminal)
              } else {
                inputStream.write(data)
                isExit = input.current === 'exit'
              }
            })
            break
          }
          default:
            if (!input.current) {
              break
            }
            terminal.writeln(` You entered: ${input.current}`)
            break
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        terminal.writeln(` ${TermColors.Red}${message}${TermColors.Reset}`)
        terminal.writeln('')
      }
    },
    [nodeCommand, forceUpdate, closeServer]
  )

  useEffect(
    () => {
      const terminal = new Terminal({
        tabStopWidth: 4,
      })
      const fitAddon = new FitAddon()
      terminal.loadAddon(fitAddon)
      instance.current = terminal

      const container = document.getElementById('terminal')
      if (!container) {
        return
      }

      terminal.open(container)
      terminal.writeln('')
      terminal.writeln(` Welcome ${TermColors.Yellow}to${TermColors.Reset} use xterm.js!`)
      terminal.writeln('')
      genPrompt(terminal)
   
      terminal.onKey(async event => {
        const code = event.domEvent.code
        console.log('code: ', code)

        switch (code) {
          case 'Enter':
            if (status.current === 1) { 
              terminal.writeln('')
              await runCommand()
              genPrompt(terminal)
            }
            input.current = ''
            break
          case 'Backspace':
            if (input.current.length > 0) {
              if (status.current === 1) { 
                terminal.write('\b \b')
              }
              input.current = input.current.slice(0, -1)
            }
            break
          case 'Tab': {
            if (status.current === 1) { 
              terminal.write(event.key)
            }
            const length = 4 - (input.current.length + 3) % 4
            input.current += Array(length).fill(' ').join('')
            break
          }
          default:
            if (status.current === 1) { 
              terminal.write(event.key)
            }
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
      <div>{nodeCommand.status === 'booting' && '容器加载中'}</div>
      {exitServer.current && <div onClick={closeServer}>关闭服务</div>}
      <iframe id="iframe" />
    </>
  )
}

export default App
