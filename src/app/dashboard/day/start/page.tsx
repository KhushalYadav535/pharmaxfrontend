'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Wifi, WifiOff, Battery, BatteryCharging, Sun, Target, CalendarDays,
  CheckCircle2, Clock, MapPin, Fingerprint, Lock, ShieldCheck, ArrowRight,
  KeyRound, LayoutList, Navigation, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StartOfDayPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // States
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [gpsStatus, setGpsStatus] = useState<'checking' | 'good' | 'denied' | 'error'>('checking');
  const [address, setAddress] = useState<string>('Detecting location...');
  const [authMethod, setAuthMethod] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Network
  useEffect(() => {
    const updateOnlineStatus = () => {
      setNetworkStatus(navigator.onLine ? 'online' : 'offline');
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Battery
  useEffect(() => {
    let mounted = true;
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        if (mounted) {
          setBatteryLevel(Math.round(batt.level * 100));
          setIsCharging(batt.charging);
          batt.addEventListener('levelchange', () => {
            if (mounted) setBatteryLevel(Math.round(batt.level * 100));
          });
          batt.addEventListener('chargingchange', () => {
            if (mounted) setIsCharging(batt.charging);
          });
        }
      });
    }
    return () => { mounted = false; };
  }, []);

  // Geolocation
  useEffect(() => {
    let mounted = true;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (mounted) {
            setGpsStatus('good');
            setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
          }
        },
        (err) => {
          if (mounted) {
            setGpsStatus('denied');
            setAddress('Location access denied');
          }
        }
      );
    } else {
      setGpsStatus('error');
      setAddress('Geolocation not supported');
    }
    return () => { mounted = false; };
  }, []);

  const handleStartDay = () => {
    setIsStarting(true);
    // Simulate API call
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  const getSystemStatus = () => {
    if (networkStatus === 'offline') return { ok: false, text: 'No Internet Connection', color: 'text-red-600', bg: 'bg-red-50' };
    if (gpsStatus === 'denied' || gpsStatus === 'error') return { ok: false, text: 'Location Required', color: 'text-red-600', bg: 'bg-red-50' };
    if (batteryLevel !== null && batteryLevel < 15 && !isCharging) return { ok: true, text: 'Low Battery Warning', color: 'text-amber-600', bg: 'bg-amber-50' };
    return { ok: true, text: 'System Ready', color: 'text-emerald-600', bg: 'bg-emerald-50' };
  };

  const status = getSystemStatus();

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column: Context & Status */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
              <Sun className="w-8 h-8 text-amber-500" />
              Good Morning!
            </h1>
            <p className="text-gray-500 mt-1 ml-11">
              Ready to start your day, {user?.firstName}?
            </p>
          </div>

          {/* Time & Date */}
          <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-10 -top-10 opacity-10">
              <Clock className="w-48 h-48" />
            </div>
            <p className="text-5xl font-black mb-2 tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-emerald-100 font-medium flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* System Checks */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">System Checks</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${networkStatus === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {networkStatus === 'online' ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Network</p>
                  <p className={`text-xs ${networkStatus === 'online' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {networkStatus === 'online' ? 'Connected' : 'Offline'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${gpsStatus === 'good' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Location Status</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{address}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  {isCharging ? <BatteryCharging className="w-5 h-5" /> : <Battery className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Battery</p>
                  <p className="text-xs text-blue-600">{batteryLevel !== null ? `${batteryLevel}%` : 'Checking...'}</p>
                </div>
              </div>
            </div>
            
            <div className={`mt-6 p-4 rounded-xl flex items-center justify-between ${status.bg} border border-transparent`}>
              <div className="flex items-center gap-2">
                {status.ok ? <ShieldCheck className={`w-5 h-5 ${status.color}`} /> : <AlertCircle className={`w-5 h-5 ${status.color}`} />}
                <span className={`text-sm font-bold ${status.color}`}>{status.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication & Action */}
        <div className="flex-1">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm h-full flex flex-col justify-center">
            
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Authenticate</h2>
              <p className="text-sm text-gray-500 mt-2">Verify your identity to start the day</p>
            </div>

            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              <button
                onClick={() => setAuthMethod('pin')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  authMethod === 'pin' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <LayoutList className="w-4 h-4" />
                Security PIN
              </button>
              <button
                onClick={() => setAuthMethod('password')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  authMethod === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Password
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {authMethod === 'pin' ? 'Enter 4-Digit PIN' : 'Enter Password'}
                </label>
                <input 
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder={authMethod === 'pin' ? '••••' : '••••••••'}
                  maxLength={authMethod === 'pin' ? 4 : 50}
                  className="w-full text-center text-2xl tracking-[0.5em] font-bold p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleStartDay}
              disabled={isStarting || !status.ok || (authMethod === 'pin' ? pin.length < 4 : pin.length < 1)}
              className="w-full flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isStarting ? (
                <>
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting Day...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  Mark Attendance & Start
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
