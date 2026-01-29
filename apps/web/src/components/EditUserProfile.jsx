import React, { useEffect, useState } from 'react'
import Avatar from './Avatar'
import { FaCamera, FaPen } from 'react-icons/fa'

export default function EditUserProfile({ onClose, user }) {

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-[#222d34] rounded-lg shadow-lg flex w-full max-w-96 h-[80vh] overflow-hidden">
                <div className="w-full flex flex-col items-center justify-center p-8 bg-[#222d34] text-white">
                    <div className="relative group mb-6">
                        <Avatar
                            width={160}
                            height={160}
                            imageUrl={user.profile_pic}
                            name={user.name}
                        />
                        <button
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-60 rounded-full opacity-0 group-hover:opacity-100 transition"
                            title="Change profile photo"
                        >
                            <FaCamera size={32} />
                            <span className="mt-2 text-xs font-semibold">CHANGE<br />PROFILE PHOTO</span>
                        </button>
                    </div>
                    <div className="w-full mt-4">
                        <label className="text-blue-400 text-sm">Your name</label>
                        <div className="flex items-center mt-1">
                            <input type="text" value={user.name} className="w-full bg-transparent border-b border-gray-600 text-white" readOnly />
                            <FaPen className="ml-2 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            This is not your username or PIN. This name will be visible to your contacts.
                        </p>
                    </div>
                    <div className="w-full mt-6">
                        <label className="text-blue-400 text-sm">About</label>
                        <div className="flex items-center mt-1">
                            <input type="text" value={user.about} className="w-full bg-transparent border-b border-gray-600 text-white" readOnly />
                            <FaPen className="ml-2 text-gray-400" />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                        <button onClick={onClose} className="px-6 py-2 rounded border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition">Cancel</button>
                        <button className="px-6 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}