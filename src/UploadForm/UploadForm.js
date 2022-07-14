import React, { useRef } from 'react';
import { fetchFile, createFFmpeg } from '@ffmpeg/ffmpeg';
import { getType } from 'mime';

export default function UploadForm({setVideoData, setProgress}) {
    const minuteRef = useRef();
    const secondRef = useRef();

    const ffmpeg = createFFmpeg({
      log: true,
      progress: p => {
        const percent = Math.floor(p.ratio * 100);
        if(percent === 100) return;
        setProgress(percent);
      }
    });
   
    ffmpeg.setLogger(({ type, message }) => {
      // console.log(type, message);
      /*
       * type can be one of following:
       *
       * info: internal workflow debug messages
       * fferr: ffmpeg native stderr output
       * ffout: ffmpeg native stdout output
       */
   
      if (typeof message === 'string') {
        if (message.startsWith('  Duration')) {
          console.log(message);
        } else if (message.startsWith('frame') || message.startsWith('size')) {
          console.log(message);
        } else if (message.startsWith('video:')) {
          console.log(message);
        }
      }
    });

    function selectInput(e) {
        e.currentTarget.select()
    }

    async function splitFile ({ target: { files } }) {
        const minutes = parseInt(minuteRef.current.value);
        const seconds = parseInt(secondRef.current.value);

        if(isNaN(minutes) || isNaN(seconds)) return;

        setVideoData({ isLoading: true });
        setProgress(0);

        const segmentTime = minutes * 60 + seconds;

        const { name } = files[0];
        const fileExtensionIndex = name.lastIndexOf('.');
        const nameWithoutExtension = name.substring(0, fileExtensionIndex);
        const fileExtension = name.substring(fileExtensionIndex);
        const mimeType = getType(name);

        await ffmpeg.load();
        ffmpeg.FS('writeFile', name, await fetchFile(files[0]));
        await ffmpeg.run('-i', name, '-f', 'segment', '-segment_time', segmentTime.toString(), 
            '-segment_start_number', '1', '-vcodec', 'copy', '-reset_timestamps', '1', 
            `${nameWithoutExtension} Part %d${fileExtension}`);
        const wasmFiles = await ffmpeg.FS('readdir', '.');

        const splitFiles = wasmFiles
            .filter(name => name.startsWith(`${nameWithoutExtension} `))
            .map(name => {
                const data = ffmpeg.FS('readFile', name);
                const blob = new Blob([data.buffer], { type: mimeType });
                const objectUrl = URL.createObjectURL(blob);

                return { name, objectUrl };
            });

        setVideoData({ isLoading: false, name, nameWithoutExtension, fileExtension, splitFiles });
    }

    return (
        <form className='p-5 mx-auto mt-10 text-xl bg-gray-900 border border-black rounded-md w-fit'>
            <div className='flex justify-center gap-2'>
            <input ref={minuteRef}
                className='p-2 leading-tight text-center text-gray-700 bg-gray-200 border rounded selection:bg-slate-400 border-slate-400 focus:outline-none focus:bg-white'
                type="text" defaultValue='01' maxLength={2} size={2} pattern="\d*" onFocus={selectInput} autoFocus
            />
            <span className='inline-flex h-full text-3xl font-black select-none align-items-center'>:</span>
            <input ref={secondRef}
                className='p-2 leading-tight text-center text-gray-700 bg-gray-200 border rounded selection:bg-slate-400 border-slate-400 focus:outline-none focus:bg-white'
                type="text" defaultValue='00' maxLength={2} size={2} pattern="\d*" onFocus={selectInput}
            />
            </div>
            <label tabIndex='0' role='button' aria-disabled='false' 
            className='block p-2 mt-3 font-medium text-center bg-blue-500 rounded-md shadow-md shadow-black hover:bg-blue-400'
            >
            <span className='select-none'>
                Upload Video
                <input type='file' onClick={(e) => e.currentTarget.value = null} onChange={splitFile} className='hidden' />
            </span>
            </label>
        </form>
    )
}