import React from "react";
import backgroundImage from "../assets/backgrounds/white-abstract.png"; // Adjust the path based on your folder structure

const Footer = () => {
  return (
    <footer
      className="bg-cover bg-center py-8 mt-20"
      style={{
        //backgroundImage: url("https://source.unsplash.com/random/1920x1080/?technology"),
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div className="container mx-auto text-center flex flex-col items-center bg-gradient-to-b from-white/60 via-white/40 to-white/10 p-6 rounded-lg shadow-lg max-w-4xl">
        {/* Name */}
        <h3 className="text-eerieBlack font-mono text-[24px] md:text-[28px] lg:text-[32px] font-extrabold">
          Umair
        </h3>

        {/* Quote */}
        <p className="text-neutral-700 text-[14px] sm:text-[16px] md:text-[18px] lg:text-[20px] mt-2 italic font-serif leading-relaxed relative before:content-['“'] before:text-[40px] before:text-neutral-500 before:absolute before:-left-4 before:top-[-10px] after:content-['”'] after:text-[40px] after:text-neutral-500 after:absolute after:-right-4 after:bottom-[-10px]">
          First, solve the problem. Then, write the code. - John Johnson
        </p>

        {/* Love Line */}
        <p className="text-neutral-600 text-[12px] sm:text-[14px] md:text-[16px] mt-4">
          Developed with ❤️ and dedication to craft.
        </p>

        {/* Footer Bottom */}
        {/* <div className="mt-8 w-full border-t border-neutral-300 pt-4">
          <p className="text-neutral-500 text-xs sm:text-sm md:text-base">
            © {new Date().getFullYear()} Umair. All rights reserved.
          </p>
        </div> */}
      </div>
    </footer>
  );
};

export default Footer;
