"use client";

import Link from "next/link";
import { useState } from "react";

const FOOTER_LINKS = {
  Company: ["About Us", "Careers", "Blog", "Contact Us"],
  Explore: ["Buy", "Rent", "List Property", "How It Works"],
  Support: ["Help Center", "Dispute Resolution", "Terms of Service", "Privacy Policy"],
};

export default function Footer() {
  const [email, setEmail] = useState("");

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <path d="M16 3L3 13V29H12V20H20V29H29V13L16 3Z" stroke="#C9A84C" strokeWidth="2" fill="none" />
              </svg>
              <div>
                <p className="font-bold text-[#1a237e] text-base tracking-wide leading-tight">KEYZ</p>
                <p className="text-xs text-gray-400">Real Estate</p>
              </div>
            </Link>

            <p className="text-gray-500 text-xs leading-relaxed mb-5">
              Keyz Real Estate is your trusted platform for buying, renting and managing properties with confidence and ease
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-[#0077b5] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="w-8 h-8 rounded-full bg-[#1877f2] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f09433] via-[#e6683c] to-[#dc2743] flex items-center justify-center hover:opacity-80 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                </svg>
              </a>
            </div>
          </div>

          {/* Nav columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="font-bold text-[#1a237e] text-sm mb-4">{heading}</p>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-gray-500 text-sm hover:text-[#1a237e] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <p className="font-bold text-gray-900 text-sm mb-2">Subscribe to our newsletter</p>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              Stay updated with the latest properties and news
            </p>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1a237e] transition-colors"
              />
              <button className="bg-[#1a237e] hover:bg-[#151c6b] transition-colors text-white w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-6 flex items-center justify-center">
          <p className="text-gray-400 text-xs flex items-center gap-1">
            <span>©</span>
            2026 Keyz Real Estate. All rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
}