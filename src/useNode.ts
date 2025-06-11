import { WebContainer } from "@webcontainer/api"
import { useEffect, useRef } from "react"

const useNode = () => {
    const instance = useRef<WebContainer | null>(null)
    const status = useRef<'boot' | 'unboot'>('unboot')

    useEffect(
        () => {
            if (status.current === 'unboot') {
                status.current = 'boot'
                WebContainer.boot().then(async webcontainerInstance => {
                    instance.current = webcontainerInstance

                    const files = {
                        'package.json': {
                            file: {
                                contents: `
                                {
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
                                }`,
                            },
                        },
                    };

                    await instance.current.mount(files);
                })
            }
        },
        []
    )

    const ls = async () => {
        if (!instance.current) {
            return ['error no instance']
        }

        return await instance.current!.fs.readdir('/');
    }

    return {
        ls
    }
}

export default useNode;