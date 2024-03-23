'use client'
import { useState, useEffect } from 'react'
import * as fal from "@fal-ai/serverless-client"
import Image from 'next/image'

fal.config({
  proxyUrl: "/fal/proxy",
})

const seed = Math.floor(Math.random() * 100000)
const baseArgs = {
  sync_mode: true,
  strength: .99,
  seed
}
export default function Home() {
  const [input, setInput] = useState('A cozy cabin nestled in a snow-covered mountain range under a starry night sky')
  const [image, setImage] = useState(null)
  const [sceneData, setSceneData] = useState<any>(null)
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null)
  const [_appState, setAppState] = useState<any>(null)
  const [excalidrawExportFns, setexcalidrawExportFns] = useState<any>(null)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [downloadEnabled, setDownloadEnabled] = useState<boolean>(false);

  const [Comp, setComp] = useState<any>(null);
  useEffect(() => {
    import('@excalidraw/excalidraw').then((comp) => setComp(comp.Excalidraw))
  }, [])
  useEffect(() => { setIsClient(true) }, [])
  useEffect(() => {
    import('@excalidraw/excalidraw').then((module) =>
      setexcalidrawExportFns({
        exportToBlob: module.exportToBlob,
        serializeAsJSON: module.serializeAsJSON
      })
    );
  }, []);

  const { send } = fal.realtime.connect('110602490-sdxl-turbo-realtime', {
    connectionKey: 'draw-2-pixel',
    onResult(result) {
      if (result.error) return
      setImage(result.images[0].url)
      setDownloadEnabled(true);
    }
  })

  async function getDataUrl(appState = _appState) {
    const elements = excalidrawAPI.getSceneElements()
    if (!elements || !elements.length) return
    const blob = await excalidrawExportFns.exportToBlob({
      elements,
      exportPadding: 0,
      appState,
      quality: 0.5,
      files: excalidrawAPI.getFiles(),
      getDimensions: () => { return {width: 450, height: 450}}
    })
    return await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)}).then((e:any) => e.target.result)
  }
 
  const handleImageDownload = () => {
    if (image) {
      const link = document.createElement('a');
      link.href = image;
      link.download = 'fal_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <main className="p-3">
      <div className='flex flex-col mb-4 justify-center items-center '>
      <p className="mb-2 font-extrabold text-transparent text-5xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Draw 2 Pixel</p>
      <p className='font-mono text-2xl flex justify-center'>Enter the prompt and draw to generate image</p>
      </div>
      <input
        className='border rounded-lg p-2 w-full text-black'
        value={input}
        onChange={async (e) => {
          setInput(e.target.value)
          let dataUrl = await getDataUrl()
          send({
            ...baseArgs,
            prompt: e.target.value,
            image_url: dataUrl
          })
        }}
      />

      <div className='flex flex-col md:flex-row items-center justify-center'>

        <div className="w-[550px] h-[570px] m-10">
          {
            isClient && excalidrawExportFns && (
              <Comp
                excalidrawAPI={(api: any)=> setExcalidrawAPI(api)}
                onChange={async (elements: any, appState: any) => {
                  const newSceneData = excalidrawExportFns.serializeAsJSON(
                    elements,
                    appState,
                    excalidrawAPI.getFiles(),
                    'local'
                  )
                  if (newSceneData !== sceneData) {
                    setAppState(appState)
                    setSceneData(newSceneData)
                    let dataUrl = await getDataUrl(appState)
                    send({
                      ...baseArgs,
                      image_url: dataUrl,
                      prompt: input,
                    })
                  }
                }}
              />
            )
          }
        </div>
        <div></div>
        {image && (
          <div className='flex flex-col p-8'>
            <Image
              src={image}
              width={500}
              height={500}
              alt='fal image'
            />
            <br />
            {downloadEnabled && (
              <button
                className="top-30 text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:bg-gradient-to-l focus:ring-4 focus:outline-none focus:ring-purple-200 dark:focus:ring-purple-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mb-2"
                onClick={handleImageDownload}
              >
                Download Image
              </button>
            )}
          </div>
        )}
        <div className="fixed bottom-10 right-10 group">
    <a href="https://github.com/amankr1469/Draw2Pixel" target='blank'>
        <button>
            <svg stroke-linejoin="round" stroke-linecap="round" stroke-width="2" stroke="currentColor" fill="none" viewBox="0 0 24 24" className="w-8 hover:scale-125 duration-200 hover:stroke-pink-500">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
        </button>
    </a>
    <span className="absolute -top-14 left-[50%] -translate-x-[50%] 
    z-20 origin-left scale-0 px-3 rounded-lg border 
    border-gray-300 bg-white py-2 text-sm font-bold
    shadow-md transition-all duration-300 ease-in-out 
    group-hover:scale-100 text-black">Give⭐<span>
    </span>
    </span>
</div>

      </div>
    </main>
  );
}