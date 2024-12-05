import DistributedWebApp from '../distributed-web-app';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fbfbfd]">
      {/* Apple-style navigation */}
      <nav className="bg-[rgba(22,22,23,0.8)] backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[980px] mx-auto">
          <div className="flex items-center justify-between h-[44px] px-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-[#f5f5f7]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className="text-white text-sm font-medium">
              Database Performance Lab
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-[44px]">
        {/* Hero Section - Apple style */}
        <div className="py-[80px] text-center">
          <h1 className="text-[56px] font-semibold text-[#1d1d1f] leading-tight tracking-tight">
            Global Database Performance
          </h1>
          <p className="mt-6 text-[28px] text-[#86868b] font-medium leading-tight">
            Test database transaction speeds across different regions.
          </p>
        </div>

        {/* Content Section */}
        <div className="max-w-[980px] mx-auto px-4 mb-[80px]">
          <div className="bg-white rounded-3xl shadow-apple overflow-hidden">
            <div className="p-12">
              <DistributedWebApp />
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-[120px] grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="rounded-[24px] bg-[#f5f5f7] w-[80px] h-[80px] flex items-center justify-center mx-auto mb-[22px]">
                <svg className="h-8 w-8 text-[#1d1d1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[#1d1d1f] mb-2">Lightning Fast</h3>
              <p className="text-[17px] text-[#86868b] leading-relaxed">
                Upload files quickly to any region
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="rounded-[24px] bg-[#f5f5f7] w-[80px] h-[80px] flex items-center justify-center mx-auto mb-[22px]">
                <svg className="h-8 w-8 text-[#1d1d1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[#1d1d1f] mb-2">Secure</h3>
              <p className="text-[17px] text-[#86868b] leading-relaxed">
                End-to-end encryption for your files
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="rounded-[24px] bg-[#f5f5f7] w-[80px] h-[80px] flex items-center justify-center mx-auto mb-[22px]">
                <svg className="h-8 w-8 text-[#1d1d1f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                </svg>
              </div>
              <h3 className="text-[24px] font-semibold text-[#1d1d1f] mb-2">Global</h3>
              <p className="text-[17px] text-[#86868b] leading-relaxed">
                Access your files from anywhere
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#d2d2d7] py-[16px]">
        <div className="max-w-[980px] mx-auto px-4">
          <p className="text-center text-[12px] text-[#86868b]">
            Copyright © 2024 Database Performance Lab. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 