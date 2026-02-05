import React from 'react'
import { PiUserCircle } from "react-icons/pi";
import bgColor from './bgColor';
const Avatar = ({ name, imageUrl, width, height, isOnline }) => {
    let avatarName = ""

    if (name) {
        const splitName = name?.split(" ")

        if (splitName.length > 1) {
            avatarName = splitName[0][0] + splitName[1][0]
        } else {
            avatarName = splitName[0][0]
        }
    }

    const nameHash = name ? name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colorIndex = nameHash % (bgColor.length || 1);

    return (
        <div className={`text-slate-800 rounded-full border-cyan-100 border font-bold relative`} style={{ width: width + "px", height: height + "px" }}>
            {
                imageUrl ? (
                    <img
                        src={imageUrl}
                        width={width}
                        height={height}
                        alt={name}
                        className='overflow-hidden rounded-full object-cover w-full h-full'
                    />
                ) : (
                    name ? (
                        <div style={{ width: width + "px", height: height + "px" }} className={`overflow-hidden rounded-full flex justify-center items-center text-lg ${bgColor[colorIndex]}`}>
                            {avatarName}
                        </div>
                    ) : (
                        <PiUserCircle
                            size={width}
                        />
                    )
                )
            }

            {isOnline && (
                <div className='bg-blue-600 p-1 absolute bottom-0 right-0 z-10 rounded-full border-2 border-[#0f172a] shadow-sm animate-pulse'></div>
            )}
        </div>
    )
}

export default Avatar
