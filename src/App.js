import React, { useState, useRef } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { getType } from 'mime'
import './App.css';
import './loader.css';
import ResultVideo from './ResultVideo';

function App() {
  const [videoData, setVideoData] = useState({ isLoading: false });
  const [progress, setProgress] = useState(0);
  const minuteRef = useRef();
  const secondRef = useRef();

  const ffmpeg = createFFmpeg({
    log: false,
    progress: p => {
      const percent = Math.floor(p.ratio * 100);
      if(percent === 100) return;
      setProgress(percent);
    }
  });

  function selectInput(e) {
    e.currentTarget.select()
  }

  const splitFile = async ({ target: { files } }) => {
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
    <div className='App'>
      {videoData.isLoading && <div className='absolute inset-0 bg-black bg-opacity-80'>
        <div className='absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 flex flex-col items-center font-[roboto]'>
          <div className="loader">Load&nbsp;ng</div>
          <div>{progress}%</div>
        </div>
      </div>}
      <div className='watermark'>VS</div>
      <h1 className='mt-10 font-extrabold tracking-tight text-center text-7xl lg:text-9xl'>Video Splitter</h1>
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
      {videoData.name && <div className='max-w-2xl p-4 pb-10 mx-auto bg-gray-900 border border-black rounded-md mt-7'>
        <summary title={videoData.name}>
          <h2 className='flex justify-center text-xl font-bold'>
            <div className='max-w-[25ch] overflow-hidden text-ellipsis'>{videoData.nameWithoutExtension}</div>
            <div>{videoData.fileExtension}</div>
          </h2>
        </summary>
        <div className='mt-3 results-grid'>
          {videoData.splitFiles?.map(({ name, objectUrl }, index) => {
            return <ResultVideo key={`v-${index}`} name={name} objectUrl={objectUrl} index={index} />
          })}
        </div>
      </div>}
    </div>
  );
}

export default App;
