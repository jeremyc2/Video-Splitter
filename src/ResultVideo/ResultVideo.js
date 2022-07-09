import React, { useRef } from 'react';

export default function ResultVideo({name, objectUrl, index}) {
    const videoRef = useRef();

    function handleVideoMouseEnter(e) {
        videoRef.current.play();
    }

    function handleVideoMouseLeave(e) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
    }
    
    return (
    <a download={name} href={objectUrl} onMouseEnter={handleVideoMouseEnter} onMouseLeave={handleVideoMouseLeave} 
        className='flex flex-col overflow-hidden rounded-sm'>
        <video ref={videoRef} src={objectUrl} muted></video>
        <div className='flex justify-center gap-1 py-2 font-medium text-gray-700 bg-gray-50 px-7'>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Part {index + 1}
        </div>
    </a>)
}