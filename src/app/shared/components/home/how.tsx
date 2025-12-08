import { Search, CalendarCheck, Plane } from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="justify-items-center py-20 w-[90%] max-w-5xl">
      <h1 className="text-4xl font-bold text-gray-800">How It Works</h1>
      <p className="text-md font-extralight text-gray-500 mt-5">
        Your journey to a dream vacation is just three simple steps away.
      </p>
      <div className="flex items-center justify-items-center pt-16 gap-40">
        <div className="justify-items-center">
          <div className="w-25 h-25 rounded-full shadow-xl shadow-gray-200 p-1">
            <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center">
              <Search className="text-emerald-500" size={32} />
            </div>
          </div>
          <h2 className="text-gray-800 text-xl font-bold mt-6">
            Find Your Destination
          </h2>
          <p className="text-gray-500 text-sm max-w-55 text-center mt-6">
            Browse through our curated list of top destinations and find the one
            that speaks to you.
          </p>
        </div>
        <div className="justify-items-center">
          <div className="w-25 h-25 rounded-full shadow-xl shadow-gray-200 p-1">
            <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center">
              <CalendarCheck className="text-emerald-500" size={32} />
            </div>
          </div>
          <h2 className="text-gray-800 text-xl font-bold mt-6">
            Book Your Trip
          </h2>
          <p className="text-gray-500 text-sm max-w-55 text-center mt-6">
            Select your dates and package. Our seamless booking process makes it
            easy and secure.
          </p>
        </div>
        <div className="justify-items-center">
          <div className="w-25 h-25 rounded-full shadow-xl shadow-gray-200 p-1">
            <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center">
              <Plane className="text-emerald-500" size={32} />
            </div>
          </div>
          <h2 className="text-gray-800 text-xl font-bold mt-6">
            Enjoy Your Journey
          </h2>
          <p className="text-gray-500 text-sm max-w-55 text-center mt-6">
            Pack your bags and get ready for an unforgettable experience. We
            handle the rest.
          </p>
        </div>
      </div>
    </div>
  );
}
