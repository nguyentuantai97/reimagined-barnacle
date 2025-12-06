import Image from 'next/image';
import { Phone, MapPin, Clock, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[#6B4423] text-[#E8D5C4]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <Image
                src="/logo_an-removebg-while.png"
                alt="AN Milk Tea & Tea"
                width={100}
                height={100}
                className="object-contain"
              />
            </div>
            <p className="text-sm leading-relaxed opacity-90">
              Thưởng thức hương vị trà sữa thơm ngon, đậm đà với nguyên liệu tươi
              mới mỗi ngày. Đặt hàng online, giao tận nơi!
            </p>
            <p className="text-xs mt-3 tracking-widest text-[#D4915C]">SINCE 2025</p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-[#D4915C] mt-0.5 shrink-0" />
                <a
                  href="https://maps.google.com/?q=10.666694951717572,106.56490596564488"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm hover:text-white hover:underline transition-colors"
                >
                  112 Đường Hoàng Phan Thái, Ấp 2, Xã Bình Chánh, Huyện Bình Chánh, TP.HCM
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#D4915C] shrink-0" />
                <a href="tel:0976257223" className="text-sm hover:text-white transition-colors">
                  0976 257 223
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-[#D4915C] mt-0.5 shrink-0" />
                <span className="text-sm">
                  Mở cửa: 10:00 - 21:00
                  <br />
                  (Tất cả các ngày)
                </span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Theo dõi chúng tôi</h3>
            <div className="flex gap-3">
              <a
                href="https://zalo.me/84976257223"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0068FF] hover:bg-[#005CE6] transition-colors"
                title="Zalo"
              >
                <svg className="h-6 w-6" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="white"/>
                  <path d="M24 8C14.6 8 7 14.8 7 23.2c0 4.2 1.8 8 4.8 10.8L10.5 42l7.2-3.2c1 .2 2 .2 3 .2 9.4 0 17-6.8 17-15.2S33.4 8 24 8z" fill="#0068FF"/>
                  <path d="M18 19h8v2h-6v2h6v2h-6v2h6v2h-8V19zm10 0h8v2h-6v2h4v6h-2v-4h-2v4h-2V19z" fill="white"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61573607969403"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5A2B] hover:bg-[#1877F2] transition-colors"
                title="Fanpage"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/trung.anh.51197"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8B5A2B] hover:bg-[#1877F2] transition-colors"
                title="Facebook cá nhân"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </a>
            </div>
            <p className="mt-4 text-sm opacity-80">
              Nhắn Zalo hoặc Fanpage để đặt hàng nhanh!
            </p>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#8B5A2B]">
          <p className="text-center text-sm opacity-70">
            © {new Date().getFullYear()} AN Milk Tea & Tea. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
