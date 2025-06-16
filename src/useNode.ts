import { WebContainer } from "@webcontainer/api"
import { useEffect, useRef, useState } from "react"

const packageStr = JSON.stringify({
    "name": "vite-starter",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview",
        "express": "node main.mjs"
    },
    "devDependencies": {
        "vite": "^4.0.4",
        "express": "^5.1.0"
    }
}, null, 2)

const mainJS = `
import express from 'express'

const app = express()

app.get('/', (req, res) => {
    console.log('get a request')
    res.send('hello world')
})

app.listen(8888, () => {
    console.log("应用实例，访问地址为 http://127.0.0.1:8888")
})
`

const files = {
    document: {
        directory: {
            'blog.md': {
                file: {
                    contents: 'Today I bought a macbook air m4. '
                }
            }
        }
    },
     "index.html": {
    file: {
      contents: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/vite.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Vite + Vue</title>
        </head>
        <body>
          <div id="app">这是 WebContainer 测试页面</div>
        </body>
      </html>
      `,
    },
  },
    'package.json': {
        file: {
            contents: packageStr,
        },
    },
    'main.mjs': {
        file: {
            contents: mainJS,
        }
    },
    aaaaaaaaaaaa: {
        file: {
            contents: 'a'
        }
    },
    bbbbbbbbbbbbb: {
        file: {
            contents: 'b'
        }
    },
    ccccccccccccc: {
        file: {
            contents: 'c'
        }
    },
    ddddddddddddd: {
        file: {
            contents: 'd'
        }
    },
    eeeeeeeeeeeeee: {
        file: {
            contents: 'e'
        }
    }
}

const openIframe = (url: string) => {
    const iframe = document.querySelector("iframe");
    if (!iframe) {
        return
    }
    iframe.src = url;
}

export const closeIframe = () => {
    const iframe = document.querySelector("iframe");
    if (!iframe) {
        return
    }
    iframe.removeAttribute('src')
}

const useNode = () => {
    const instance = useRef<WebContainer | null>(null)
    const [status, setStatus] = useState<'boot' | 'unboot' | 'booting'>('unboot')
    const statusRef = useRef<'boot' | 'unboot' | 'booting'>('unboot')

    useEffect(
        () => {
            if (statusRef.current === 'unboot') {
                setStatus('booting')
                statusRef.current = 'booting'
                WebContainer.boot().then(async webcontainerInstance => {
                    setStatus('boot')
                    statusRef.current = 'boot'

                    instance.current = webcontainerInstance

                    await instance.current.mount(files)
                })
            }

            return () => {
                if (statusRef.current === 'boot' && instance.current) {
                    instance.current.teardown()
                    setStatus('unboot')
                    statusRef.current = 'unboot'
                }
            }
        },
        [statusRef]
    )

    const check = () => {
        if (!instance.current) {
            throw new Error('error no instance')
        }
    }

    const ls = async (pwd?: string) => {
        check()

        const files =  await instance.current!.fs.readdir(pwd || '/', {
            withFileTypes: true,
        })

        return files.map(v => ({
            name: v.name,
            isDir:  v.isDirectory()
        }))
    }

    const mkdir = async (name: string) => {
        check()
        
        await instance.current!.fs.mkdir(name)
    }

    const rmdir = async (name: string) => {
        check()
        
        await instance.current!.fs.rm(name, { recursive: true })
    }

    const openVite = async () => {
        check()

        const install = await instance.current!.spawn("pnpm", ["install"]);
        install.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(data);
                },
            })
        );

        const code = await install.exit;
        if (code !== 0) throw new Error("error to install.");
        
        const process = await instance.current!.spawn("pnpm", ["dev"]);
        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(data);
                },
            })
        );

        instance.current!.on("server-ready", (port, url) => {
            console.log("server-ready", url);
            const iframe = document.querySelector("iframe");
            if (!iframe) {
                return
            }
            iframe.style.display = 'block'
            iframe.src = url;
        })

    }

    const openServer = async () => {
        check()

        // await instance.current!.spawn('node', ['main.mjs'])
        const install = await instance.current!.spawn("pnpm", ["install"]);
        install.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(data);
                },
            })
        );

        const code = await install.exit;
        if (code !== 0) throw new Error("error to install.");
        
        const process = await instance.current!.spawn("pnpm", ["express"]);
        process.output.pipeTo(
            new WritableStream({
                write(data) {
                    console.log(data);
                },
            })
        );

        instance.current!.on("server-ready", (port, url) => {
            console.log("server-ready", url);
            openIframe(url)
        })

        return process.kill.bind(process);
    }

    return {
        ls,
        mkdir,
        rmdir,
        openServer,
        openVite,
        status,
    }
}

export default useNode