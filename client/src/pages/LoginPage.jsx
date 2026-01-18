import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const { login, sendOtp } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if(phoneNumber) {
         try {
             const res = await sendOtp(phoneNumber);
             alert(`OTP Whisper: ${res.otp || '123456'}`);
             setStep(2);
         } catch(e) {
             alert('The stars were silent. (Failed to send OTP)');
         }
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp) {
        try {
            await login(phoneNumber, otp);
            navigate('/chat');
        } catch (e) {
            alert('Alignment Incorrect (Invalid OTP)');
        }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center relative overlow-hidden">
      
      {/* Background Image (Centered) */}
      <div className="fixed inset-0 z-[-1]">
          <img 
            src="/bg-himalayas.png" 
            alt="Himalayan Sky" 
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center' }}
          />
          <div className="absolute inset-0 bg-black/40"></div>
      </div>
      
      {/* Decorative Sacred Geometry Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-900/30 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse animation-delay-2000"></div>

      <div className="cosmic-card p-6 md:p-12 w-[90vw] md:w-full max-w-lg relative z-10 rounded-full aspect-square flex flex-col items-center justify-center border-2 border-white/5 shadow-[0_0_50px_rgba(218,165,32,0.1)] backdrop-blur-3xl">
        
        {/* Header */}
        <div className="text-center mb-4 md:mb-8 mt-2 md:mt-4">
          <div className="text-3xl md:text-5xl mb-2 md:mb-4 text-[#DAA520] opacity-80 animate-spin-slow" style={{ animationDuration: '20s' }}>
             ☸
          </div>
          <h1 className="text-xl md:text-3xl font-spiritual font-bold text-[#f2e8cf] tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            Dharmic Marga
          </h1>
          <p className="text-[#DAA520]/60 text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.5em] mt-1 md:mt-2">Connecting Souls</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="w-full max-w-[200px] md:max-w-xs space-y-4 md:space-y-6">
            <div className="relative group">
               <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="cosmic-input w-full px-4 py-3 md:px-6 md:py-4 rounded-full text-center text-sm md:text-lg placeholder-white/20 bg-black/40 border border-[#DAA520]/30 focus:border-[#DAA520]"
                placeholder="Phone Number"
                required
              />
            </div>
            
            <button
              type="submit"
              className="w-full py-3 md:py-4 rounded-full cosmic-btn text-xs md:text-sm uppercase tracking-[0.2em]"
            >
              Begin Journey
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="w-full max-w-[200px] md:max-w-xs space-y-4 md:space-y-6 fade-in text-center">
             <div>
                <p className="text-[#f2e8cf]/60 text-[10px] md:text-xs mb-2 md:mb-4 uppercase tracking-widest">Enter the Key</p>
                <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-transparent border-b border-[#DAA520]/50 text-center text-2xl md:text-4xl text-[#f2e8cf] tracking-[0.3em] md:tracking-[0.5em] py-1 md:py-2 focus:outline-none focus:border-[#DAA520] font-spiritual"
                    placeholder="......"
                    maxLength={6}
                    required
                />
            </div>

            <button
              type="submit"
              className="w-full py-3 md:py-4 rounded-full cosmic-btn text-xs md:text-sm uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(218,165,32,0.4)]"
            >
              Enter Sanctuary
            </button>
            
             <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-[10px] md:text-xs text-white/30 hover:text-[#DAA520] transition uppercase tracking-widest mt-2 md:mt-4"
            >
                Return
            </button>
          </form>
        )}
        
      </div>
      
       <div className="absolute bottom-8 text-[10px] text-[#f2e8cf]/20 tracking-[1em] uppercase">
           Himalayan • Frequency
       </div>
    </div>
  );
};

export default LoginPage;
