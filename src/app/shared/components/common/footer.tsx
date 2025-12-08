import { Globe } from "lucide-react";
import {
  FaApplePay,
  FaGooglePay,
  FaPaypal,
  FaAlipay,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcDinersClub,
} from "react-icons/fa";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="bg-neutral-950 justify-items-center px-10">
      <div className="w-[90%] max-w-5xl">
        <div className="w-full justify-items-center py-10">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-500">
            <Globe size={48} className="text-gray-100" />
          </div>
          <h1 className="text-4xl font-bold mt-3">
            Global<span className="text-emerald-500">Tours</span>
          </h1>
          <p className="text-center text-gray-500 px-5 mt-5">
            Welcome to GlobalTours! We are a travel management company that
            provide you with local travel experts to plan customised
            <br />
            travel itineraries for you. We have offices in Australia, Sri Lanka,
            and India, however we cater to anybody anywhere in the world!
            <br />
            Our aim is to make your travel dreams come true.
          </p>
          <div className="flex gap-6 mt-10">
            <Link href={""} className="font-semibold text-lg">
              About Us
            </Link>
            <Link href={""} className="font-semibold text-lg">
              Holydays & Tours
            </Link>
            <Link href={""} className="font-semibold text-lg">
              Success Stories
            </Link>
            <Link href={""} className="font-semibold text-lg">
              My Ambassador
            </Link>
            <Link href={""} className="font-semibold text-lg">
              FAQ
            </Link>
            <Link href={""} className="font-semibold text-lg">
              Contact Us
            </Link>
            <Link href={""} className="font-semibold text-lg">
              Banks
            </Link>
          </div>
          <div className="flex gap-6 mt-10">
            <Link href={""} className="font-light text-sm text-gray-500">
              Privacy Policy
            </Link>
            <Link href={""} className="font-light text-sm text-gray-500">
              Cancellation Policy
            </Link>
            <Link href={""} className="font-light text-sm text-gray-500">
              Terms and Conditions
            </Link>
            <Link href={""} className="font-light text-sm text-gray-500">
              Cashback Terms
            </Link>
            <Link href={""} className="font-light text-sm text-gray-500">
              Careers
            </Link>
            <Link href={""} className="font-light text-sm text-gray-500">
              News and Events
            </Link>
          </div>
          <div className="mt-10">
            <h3 className="text-md  text-gray-500 w-full text-center">
              SOCIAL MEDIA
            </h3>
            <div className="flex gap-6 mt-8">
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Linkedin
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Twitter
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Instagram
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Youtube
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Facebook
              </Link>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-md  text-gray-500 w-full text-center">
              DESTINATIONS
            </h3>
            <div className="flex gap-6 mt-8">
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Sri Lanka
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Maldives
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Vietnam
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Indonesia
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Dubai
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Cambodia
              </Link>
              <Link href={""} className="font-semibold text-lg text-gray-100">
                Singapore
              </Link>
            </div>
          </div>
          <div className="mt-10">
            <h3 className="text-md  text-gray-500 w-full text-center">
              ACCEPTED PAYMENT METHODS
            </h3>
            <div className="flex gap-6 items-center mt-8">
              <Link href={""} className="">
                <FaApplePay size={50} />
              </Link>
              <Link href={""} className="">
                <FaGooglePay size={50} />
              </Link>
              <Link href={""} className="">
                <FaPaypal size={35} />
              </Link>
              <Link href={""} className="">
                <FaAlipay size={35} />
              </Link>
              <Link href={""} className="">
                <FaCcVisa size={35} />
              </Link>
              <Link href={""} className="">
                <FaCcMastercard size={35} />
              </Link>
              <Link href={""} className="">
                <FaCcAmex size={35} />
              </Link>
              <Link href={""} className="">
                <FaCcDinersClub size={35} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      <hr className="w-full text-gray-500 my-5" />
      <div className="flex w-full justify-between items-center text-xs my-5">
        <div className="flex gap-2">
          <p>© {new Date().getFullYear() } GlobalTours (Pvt) LTD. All rights reserved.</p>
          <p>GlobalTours (PTY) LTD Australia (Company No: 600 102 289)</p>
        </div>
        <div className="flex gap-2">
          <p>Tourist Board License No: TS/TA/1387</p>
          <p>Civil Aviation License No: A-922</p>
        </div>
      </div>
    </div>
  );
}
