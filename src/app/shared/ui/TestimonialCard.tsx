import Image from "next/image";
import { Testimonial } from "../constants/testimonials";
import { Quote } from "lucide-react";

export default function TestimonialCard({
  quote,
  fname,
  lname,
  image,
  type,
}: Testimonial) {
  return (
    <div className="relative group min-w-xs min-h-[300px] rounded-2xl shadow-lg border border-gray-300 overflow-hidden my-12 bg-neutral-50">
      <div className="relative justify-items-center py-16">
        <Quote size={48} className="text-blue-200 absolute right-4 top-3" />
        <p className="text-center text-gray-400 w-4/5">{`"${quote}"`}</p>
      </div>
      <div className="flex items-center gap-6 absolute bottom-8 w-full px-6">
        <div className="w-14 h-14 rounded-full overflow-hidden">
          <Image
            src={image}
            alt={`${fname} ${lname}'s image`}
            width={64}
            height={64}
            className="w-full h-full object-cover object-[50%_30%]"
          />
        </div>
        <div className="text-gray-600">
          <h2>{`${fname} ${lname}`}</h2>
          <h3 className="text-blue-500">{type}</h3>
        </div>
      </div>
    </div>
  );
}
