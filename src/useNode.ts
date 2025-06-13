import { WebContainer } from "@webcontainer/api"
import { useEffect, useRef } from "react"

const packageStr = JSON.stringify({
    "name": "vite-starter",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "devDependencies": {
        "vite": "^4.0.4"
    }
}, null, 2)

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
    'package.json': {
        file: {
            contents: packageStr,
        },
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

const useNode = () => {
    const instance = useRef<WebContainer | null>(null)
    const status = useRef<'boot' | 'unboot'>('unboot')

    useEffect(
        () => {
            if (status.current === 'unboot') {
                status.current = 'boot'
                WebContainer.boot().then(async webcontainerInstance => {
                    instance.current = webcontainerInstance

                    await instance.current.mount(files)
                })
            }

            return () => {
                if (status.current === 'boot' && instance.current) {
                    instance.current.teardown()
                    status.current = 'unboot'
                }
            }
        },
        []
    )

    const check = () => {
        if (!instance.current) {
            throw new Error('error no instance')
        }
    }

    const ls = async () => {
        check()

        const files =  await instance.current!.fs.readdir('/', {
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

    return {
        ls,
        mkdir,
        rmdir
    }
}

export default useNode