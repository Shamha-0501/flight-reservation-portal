import { MapPin, Clock4, Dot } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Destination } from "../constants/destinations";

export default function TourCard({
  path,
  country,
  duration,
  title,
  description,
  price,
  rating,
}: Destination) {
  return (
    <div className="group max-w-xs rounded-2xl shadow-xl border border-gray-300 overflow-hidden">
      <div className="relative w-full h-60 overflow-hidden rounded-t-2xl">
        <Image
          src={`${path}`}
          alt="Tour Destionation Image"
          fill
          className="object-cover rounded-t-2xl group-hover:scale-[1.5] transition duration-700"
        />
      </div>
      <div className="p-6 h-60">
        <div className="flex items-center gap-2 text-gray-400">
          <MapPin size={15} className="text-emerald-500" />
          <p className="text-sm font-extralight">{country}</p>
          <p>
            <Dot />
          </p>
          <Clock4 size={15} className="text-blue-500"/>
          <p className="text-sm font-extralight">{duration}</p>
        </div>
        <h2 className="text-gray-800 font-bold text-xl pt-3 group-hover:text-emerald-500 transition duration-700">{title}</h2>
        <p className="text-gray-400 font-extralight text-sm pt-3">{description}</p>
        <hr className="my-3 text-gray-200"/>
        <div className="flex justify-between items-center">
            <div className="text-gray-600">
                <p>From</p>
                <p className="text-blue-500 font-bold text-2xl">{price}</p>
            </div>
            <div>
                <Link href={''} className="bg-gray-900 p-3 rounded-lg">Details</Link>
            </div>
        </div>
      </div>
    </div>
  );
}
