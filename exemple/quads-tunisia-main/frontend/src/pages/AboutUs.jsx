import { useState, useEffect } from 'react';
import { setSEO } from '../utils/seo';

function AboutUs() {
  useEffect(() => {
    setSEO({
      title: 'About Us',
      description: 'Learn about Quads Tunisia — our story, our commitment to safety, and our passion for delivering unforgettable water sports and adventure experiences in Sousse and Monastir.',
      keywords: 'about Quads Tunisia, water sports company Tunisia, Sousse adventure company, Monastir tour operator',
      path: '/about',
    });
  }, []);

  return (
    <div className="w-full bg-[#fffbf4] dark:bg-[#29231c]">
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative">
          <div
            className="w-full h-[60vh] lg:h-[70vh] bg-cover bg-center"
            style={{
              backgroundImage: 'linear-gradient(rgba(48, 37, 28, 0.4) 0%, rgba(48, 37, 28, 0.6) 100%), url("https://lh3.googleusercontent.com/aida-public/AB6AXuDFyIP9AXp3cTzYO_nStAtWReZIFEWhVS6V101DoEeOQYwwCUJnIZW7JV3KyRY0Ig6LIQ126YoO20JbQ5DX-VDnGplzPYt_rdvcGU6mX7ILsDQPUkW_oJkWbpAs44K-iJODHBB71bnK5ZTNkbK5CvSxc4LZmkkw-m5S5hVWImHHdV7Kpl--ngQhjK3j38xfQHzgRa7DMQcgpLhg2MzCfHgqIiL0RE7SHrYnk8BT7TLPXN_MeckCILX5GZJKUxOjgjenjba-OeSNNKf2")'
            }}
          >
            <div className="flex h-full flex-col items-center justify-center gap-6 p-4 text-center">
              <h1 className="text-white text-4xl font-black leading-tight tracking-tight md:text-6xl max-w-3xl drop-shadow-2xl">
                Our Voyage: The Story of Quads Tunisia
              </h1>
              <h2 className="text-white/90 text-base font-normal leading-normal md:text-lg max-w-2xl drop-shadow-lg">
                Discover our passion for the sea and our commitment to delivering unforgettable marine adventures.
              </h2>
            </div>
          </div>
        </section>

        {/* Timeline Section */}
        <section className="py-16 sm:py-24 px-6 lg:px-10 bg-[#F8F9FA] dark:bg-[#30251c]/20">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16 items-start">
            <div className="w-full md:w-1/3">
              <h2 className="text-[#30251c] dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Our Journey from a Simple Idea to a Premier Adventure Destination
              </h2>
            </div>
            <div className="w-full md:w-2/3">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-[#c45112] w-12 h-12 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                      </svg>
                    </div>
                    <div className="w-0.5 bg-gray-300 dark:bg-gray-600 h-full mt-2"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-[#30251c] dark:text-white text-lg font-bold leading-normal">The Spark</p>
                    <p className="text-[#30251c]/70 dark:text-white/60 text-base font-normal leading-normal">
                      2015 - A shared passion for the ocean ignited an idea: to create a new standard for marine adventures.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-[#c45112] w-12 h-12 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
                        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
                      </svg>
                    </div>
                    <div className="w-0.5 bg-gray-300 dark:bg-gray-600 h-full mt-2"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-[#30251c] dark:text-white text-lg font-bold leading-normal">First Vessel</p>
                    <p className="text-[#30251c]/70 dark:text-white/60 text-base font-normal leading-normal">
                      2017 - We acquired our first catamaran, 'The Wanderer,' and began offering exclusive private charters.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-[#c45112] w-12 h-12 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path fillRule="evenodd" d="M15.22 6.268a.75.75 0 01.968-.432l5.942 2.28a.75.75 0 01.431.97l-2.28 5.941a.75.75 0 11-1.4-.537l1.63-4.251-1.086.483a11.2 11.2 0 00-5.45 5.174.75.75 0 01-1.199.19L9 12.31l-6.22 6.22a.75.75 0 11-1.06-1.06l6.75-6.75a.75.75 0 011.06 0l3.606 3.605a12.694 12.694 0 015.68-4.973l1.086-.484-4.251-1.631a.75.75 0 01-.432-.97z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="w-0.5 bg-gray-300 dark:bg-gray-600 h-full mt-2"></div>
                  </div>
                  <div className="flex-1 pb-8">
                    <p className="text-[#30251c] dark:text-white text-lg font-bold leading-normal">Expansion</p>
                    <p className="text-[#30251c]/70 dark:text-white/60 text-base font-normal leading-normal">
                      2019 - Our fleet grew to include jet skis and parasailing, broadening our range of adrenaline-fueled activities.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-[#c45112] w-12 h-12 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                        <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 00-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 00.75-.75 2.25 2.25 0 00-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 013.16 5.337a45.6 45.6 0 012.006-.343v.256zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 01-2.863 3.207 6.72 6.72 0 00.857-3.294z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#30251c] dark:text-white text-lg font-bold leading-normal">Going Premium</p>
                    <p className="text-[#30251c]/70 dark:text-white/60 text-base font-normal leading-normal">
                      2022 - We redefined our brand to focus on premium, all-inclusive experiences, ensuring every adventure is unforgettable.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="py-16 sm:py-24 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 text-center mb-12">
              <h2 className="text-[#30251c] dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Our Core Values
              </h2>
              <p className="text-[#30251c]/70 dark:text-white/60 text-base md:text-lg font-normal leading-normal max-w-3xl mx-auto">
                We are driven by a set of core values that ensure every adventure is safe, exceptional, and respectful of our beautiful marine environment.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#29231c] p-6 text-center items-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-[#c45112] p-3 bg-[#c45112]/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                    <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[#30251c] dark:text-white text-xl font-bold leading-tight">Safety First</h3>
                  <p className="text-[#30251c]/70 dark:text-white/60 text-sm font-normal leading-normal">
                    Our certified crew and top-tier equipment guarantee your safety is always our top priority.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#29231c] p-6 text-center items-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-[#c45112] p-3 bg-[#c45112]/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[#30251c] dark:text-white text-xl font-bold leading-tight">Premium Experience</h3>
                  <p className="text-[#30251c]/70 dark:text-white/60 text-sm font-normal leading-normal">
                    From our modern fleet to our personalized service, we deliver excellence at every turn.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#29231c] p-6 text-center items-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-[#c45112] p-3 bg-[#c45112]/10 rounded-full w-16 h-16 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
                    <path d="M11.47 1.72a.75.75 0 011.06 0l3 3a.75.75 0 01-1.06 1.06l-1.72-1.72V7.5h-1.5V4.06L9.53 5.78a.75.75 0 01-1.06-1.06l3-3zM11.25 7.5V15a.75.75 0 001.5 0V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
                  </svg>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-[#30251c] dark:text-white text-xl font-bold leading-tight">Eco-Conscious</h3>
                  <p className="text-[#30251c]/70 dark:text-white/60 text-sm font-normal leading-normal">
                    We are dedicated to preserving the pristine beauty of our oceans for generations to come.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Team Showcase Section */}
        <section className="py-16 sm:py-24 px-6 lg:px-10 bg-[#F8F9FA] dark:bg-[#30251c]/20">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col gap-4 text-center mb-12">
              <h2 className="text-[#30251c] dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight">
                Meet the Crew
              </h2>
              <p className="text-[#30251c]/70 dark:text-white/60 text-base md:text-lg font-normal leading-normal max-w-3xl mx-auto">
                Our team of certified professionals is the heart of our operation, bringing expertise, passion, and a love for the sea to every adventure.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: "Mahmoud Ben Said", role: "Owner", img: "/images/team/founder.webp", pos: "center 20%" },
                { name: "Khalil Ben Haj", role: "Guide", img: "/images/team/guide.webp", pos: "center" },
                { name: "Adam Woula", role: "Manager", img: "/images/team/manager.webp", pos: "center 15%" },
                { name: "Dali Bena", role: "Safety Officer", img: "/images/team/safety.webp", pos: "center 25%" }
              ].map((member, index) => (
                <div key={index} className="flex flex-col items-center text-center group">
                  <div className="relative w-full aspect-square rounded-full overflow-hidden mb-4">
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: member.pos }}
                      alt={member.name}
                      src={member.img}
                    />
                  </div>
                  <h4 className="text-[#30251c] dark:text-white text-lg font-bold">{member.name}</h4>
                  <p className="text-[#c45112] text-sm font-medium">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications Section */}
        <section className="py-16 sm:py-24 px-6 lg:px-10">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-[#30251c] dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
              Certified for Your Safety
            </h2>
            <p className="text-[#30251c]/70 dark:text-white/60 text-base md:text-lg font-normal leading-normal max-w-3xl mx-auto mb-12">
              We adhere to the highest international standards for safety and quality. Our certifications are a testament to our unwavering commitment to your well-being.
            </p>
            <div className="flex justify-center items-center gap-12 sm:gap-16 flex-wrap grayscale opacity-60 dark:invert dark:opacity-80">
              <img className="h-12" alt="PADI certification logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAw7ENQYSa1Tld2YW854S-xK0ZA8WLrsXMgccrI4rsZYTeXdP_BHjPbTQ6GOqMFHeuJGu8Jcvw-2oijoMZiOp_yOrcNp1htE6EJOAWN4BBzNtv_Ul4pS1M1anCzR6Uij_NdjZCXa-3g6_kAc15Msf5cxF7obion_tjx_mMMYWmEoWIxEIGu-lkeYfjZpjow2CLwAw8EeHuttvrJKonQn3a3dm_cepAvuAebmj7eQ0X3NFIPAMAzcJiJlQ82BT_7R1fZzBhn7p_oKgkU" />
              <img className="h-14" alt="IYT Worldwide certification logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB20nGcj0CzqQAMKzecOgB_w5kfHWoZ_owzACElFPjxePCzXNVJRvhiqmAouJXiD9pnVNu02dAtzDCRzsTuP_VyIRDuE-BtdDh23SR37hBCJNM_g_-N6YoTqZ7oMPckohmYvO0YlWyZq_ccKoKlU6NCw9PiFAoRQb9x9UEpnVU3ELtHEh4sBx2sIE2BGV6m9_J_o-2jPV63zgAWEjq86kRlUtQVCZ2dQRjUJGaRsAEMyJfkeZeX8YN0azVAZtugY0ERK8UCyAw9ew3b" />
              <img className="h-10" alt="Maritime Authority certification logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDHwTUal15B6wn_tc2g6sr0sIFewo5BocOg0qW9TYhx_ijAaBtDzW0uNEQXipd1tCqNQMEU4ehEGS9J7e3eTVxvDCSpjQaXKjo-4v6SByNEiVlgUSWPZ8x_3gaTBqgCtzgs4QnBuVjIqYDvDK8wRnz0XRn6NJeYDKBAKfL8u2ccOY4NlmgTVjLzgL8VsBLMScZrnXrftKELhNvqZriMNkh1dLUCf6Vltfj7Y2MXYr3_NHZ8w9OorbdCDV3WKYtQ--gqIe9wHvqCxxzh" />
              <img className="h-12" alt="SafeSeas certification logo" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQHQKhlVTNhhucW9D36KT576TTx70Tn0a2pL6ZEfhL8h1lsIpOb1la3MOPwf5BZkQtrRrbfBBuso0GlKlob2VryU0vqPfjHd-ltaELypHQi1UA5T-kG-xQ9S4tiLudQ4N7U0GXNoswXrYGQkX3DO25oacDQEiZSyA_5rit5Op1s4J224TWJREVsgq460EMHrqL_RROuTOSwI1jJqlveA75pRE2kXaf8UkDyeB3ymZSzIhVdkns54jAvJnVRex-GKqNBlFx-tgfzKrL" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#30251c]">
          <div className="max-w-none mx-auto py-20 px-6 lg:px-10 text-center bg-gradient-to-br from-[#c45112]/90 to-[#fbbf24]/90">
            <h2 className="text-white text-3xl md:text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Ready for an Unforgettable Experience?
            </h2>
            <p className="text-white/90 text-base md:text-lg font-normal leading-normal max-w-3xl mx-auto mb-8">
              The ocean is calling. Dive into our world-class marine activities and create memories that will last a lifetime.
            </p>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-12 px-6 bg-white text-[#30251c] text-base font-bold leading-normal tracking-[0.015em] mx-auto hover:bg-white/90 transition-colors">
              <span className="truncate">Explore Our Adventures</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AboutUs;
