import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { styles } from "../styles";
import { navLinks } from "../constants";
import { close, menu, logo, logotext } from "../assets";

const Navbar = () => {
  const [active, setActive] = useState("");
  const [toggle, setToggle] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleCloseNavbar = () => setToggle(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show/hide navbar based on scroll direction
      if (currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      // Close hamburger menu on mobile devices if open
      if (toggle) {
        setToggle(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, toggle]);

  return (
    <nav
      className={`${styles.paddingX} w-full flex items-center py-2 fixed
    top-0 z-20 bg-flashWhite sm:opacity-[0.97] xxs:h-[12vh] ${
      showNavbar ? "sm:translate-y-0" : "-translate-y-full"
    } transition-transform`}
    >
      <div className="w-full flex justify-between items-center max-w-7xl mx-auto">
        <Link
          to="/"
          className="flex items-center gap-2"
          onClick={() => {
            setActive("");
            window.scrollTo(0, 0);
          }}
        >
          <img
            src={logo}
            alt="logo"
            className="sm:w-[50px] sm:h-[50px] w-[45px] h-[45px] object-contain"
          />
          <img
            src={logotext}
            alt="logo"
            className="sm:w-[90px] sm:h-[90px] w-[85px] h-[85px] -ml-[0.6rem] object-contain"
          />
        </Link>

        {/* Desktop Navbar Links */}
        <ul className="list-none hidden sm:flex flex-row gap-14 mt-2">
          {navLinks.map((nav) => (
            <li
              key={nav.id}
              className={`${
                active === nav.title ? "text-french" : "text-eerieBlack"
              } hover:text-taupe text-[21px] font-medium font-mova 
                uppercase tracking-[3px] cursor-pointer nav-links`}
              onClick={() => setActive(nav.title)}
            >
              <a href={`#${nav.id}`}>{nav.title}</a>
            </li>
          ))}
        </ul>

        {/* Mobile Navbar */}
        {toggle && (
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={handleCloseNavbar}
          ></div>
        )}
        <div className="sm:hidden flex flex-1 justify-end items-center">
          {toggle ? (
            <div
              className={`fixed top-0 right-0 w-3/4 max-w-[300px] h-[35%] bg-flashWhite 
                shadow-lg z-50 rounded-l-lg p-6 menu transition-transform duration-300`}
            >
              {/* Close Button */}
              <div className="flex justify-end">
                <img
                  src={close}
                  alt="close"
                  className="w-[22px] h-[22px] object-contain cursor-pointer"
                  onClick={handleCloseNavbar}
                />
              </div>
              {/* Navbar Links */}
              <ul className="list-none flex flex-col gap-4 mt-8">
                {navLinks.map((nav) => (
                  <li
                    key={nav.id}
                    className={`${
                      active === nav.title ? "text-french" : "text-eerieBlack"
                    } hover:text-taupe text-[16px] font-medium uppercase font-mova tracking-wide transition-colors cursor-pointer`}
                    onClick={() => {
                      setActive(nav.title);
                      handleCloseNavbar();
                    }}
                  >
                    <a href={`#${nav.id}`}>{nav.title}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <img
              src={menu}
              alt="menu"
              className="w-[30px] h-[30px] object-contain cursor-pointer"
              onClick={() => setToggle(true)}
            />
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
