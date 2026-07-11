import React from 'react'
import Quote from '../common/forms/quote'

export default function GetAFreeQuote() {
  return (
    <div className='w-full flex justify-center py-20 bg-blue-100'>
        <div className='w-[90%] max-w-5xl'>
            <Quote />
        </div>
    </div>
  )
}
