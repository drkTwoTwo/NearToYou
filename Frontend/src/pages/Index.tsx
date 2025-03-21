import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import BusMap from '@/components/BusMap';
import BusList from '@/components/BusList';
import ActiveRoutes from '@/components/ActiveRoutes';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useWebSocketBuses } from '@/hooks/useWebSocketBuses';
import { BusData } from '@/services/websocketService';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Info, Search, MapPin, ArrowRight, LogIn, UserPlus, Menu, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Helper function to determine if a bus is online
const isBusOnline = (bus: BusData): boolean => {
  const hasLocation = bus.lat != null && bus.lng != null && typeof bus.lat === 'number' && typeof bus.lng === 'number';
  const lastUpdate = bus.lastUpdate ? new Date(bus.lastUpdate).getTime() : 0;
  const now = Date.now();
  const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes threshold
  return hasLocation && lastUpdate > fiveMinutesAgo;
};

const Index = () => {
  const { buses, status, error, connect } = useWebSocketBuses();
  const [selectedBus, setSelectedBus] = useState<BusData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'buses' | 'routes'>('buses');
  const [showRoutePopups, setShowRoutePopups] = useState(false);
  const [isRoutesExpanded, setIsRoutesExpanded] = useState(false);
  const isMobile = useIsMobile();
  const footerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Filter online buses
  const onlineBuses = buses.filter(isBusOnline);

  useEffect(() => {
    console.log('[Index] Total buses:', buses.length, 'Online buses:', onlineBuses.length, 'Data:', buses);
    if (status === 'connected') {
      toast.success('Connected to the bus tracking server', {
        description: 'You are now receiving real-time bus updates',
        icon: <Info className="h-4 w-4" />,
      });
    } else if (status === 'disconnected' && error) {
      toast.error('Connection lost', {
        description: error.message,
        icon: <Info className="h-4 w-4" />,
      });
    }
  }, [status, error, buses]);

  // Scroll event listener (optional)
  useEffect(() => {
    const handleScroll = () => {
      if (!isMobile || !footerRef.current) return;

      const currentScrollY = window.scrollY;
      const scrollingUp = currentScrollY < lastScrollY.current;
      const footerTop = footerRef.current.getBoundingClientRect().top;

      if (scrollingUp && footerTop < window.innerHeight) {
        console.log('Scrolling up, footer in view - enabling popups');
        setShowRoutePopups(true);
      } else {
        console.log('Scrolling down or footer out of view - disabling popups');
        setShowRoutePopups(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);

  // Touch event handlers for swipe gestures
  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartY.current - touchEndY.current;
    if (swipeDistance > 50) {
      setIsRoutesExpanded(true);
    } else if (swipeDistance < -50) {
      setIsRoutesExpanded(false);
    }
  };

  useEffect(() => {
    const footer = footerRef.current;
    if (isMobile && footer) {
      footer.addEventListener('touchstart', handleTouchStart as EventListener);
      footer.addEventListener('touchmove', handleTouchMove as EventListener);
      footer.addEventListener('touchend', handleTouchEnd as EventListener);
    }

    return () => {
      if (footer) {
        footer.removeEventListener('touchstart', handleTouchStart as EventListener);
        footer.removeEventListener('touchmove', handleTouchMove as EventListener);
        footer.removeEventListener('touchend', handleTouchEnd as EventListener);
      }
    };
  }, [isMobile]);

  const handleSelectBus = (bus: BusData) => {
    setSelectedBus(bus);
    if (isMobile) setIsMobileMenuOpen(false);
  };

  const handleRouteSearch = () => {
    if (from && to) {
      toast.success('Route search', {
        description: `Searching for buses from ${from} to ${to}`,
        icon: <Search className="h-4 w-4" />,
      });
      setSearchOpen(false);
    } else {
      toast.error('Please specify both locations', {
        icon: <Info className="h-4 w-4" />,
      });
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">Near To You</h1>
            <div className="ml-2 text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
              Live
            </div>
          </div>
          <button
            className="rounded-lg bg-primary p-2 text-white md:hidden"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden md:flex items-center space-x-2">
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Find Route
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Find a Route</DialogTitle>
                  <DialogDescription>
                    Enter your starting point and destination to find buses.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From</label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <Input
                        placeholder="Starting point"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To</label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <Input
                        placeholder="Destination"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button onClick={handleRouteSearch} className="w-full mt-2">
                    <Search className="h-4 w-4 mr-2" />
                    Search Routes
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link to="/login">
              <Button variant="outline" size="sm">
                <LogIn className="h-4 w-4 mr-2" />
                Driver Login
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Register
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-3 md:hidden flex items-center gap-2">
          <Input
            placeholder="From..."
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="flex-1 text-sm py-2"
          />
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="To..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 text-sm py-2"
          />
          <Button onClick={handleRouteSearch} className="w-16 h-10">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          <ConnectionStatus status={status} onReconnect={connect} error={error} />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden p-4">
        {/* Sidebar (Desktop Only) */}
        <div className="hidden md:flex md:w-80 md:mr-6 md:flex-shrink-0 flex-col gap-4">
          {selectedBus ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Bus Details</h3>
                <p className="text-base font-medium">{selectedBus.bus_number}</p>
                <p className="text-sm text-gray-500">{selectedBus.route_name || 'No Route'}</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">Additional Info</h3>
                <p className="text-base font-medium">Model: {selectedBus.bus_model || 'N/A'}</p>
                <p className="text-sm text-gray-500">Route: {selectedBus.route_number || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-sm text-gray-500">
              <p>Select a bus from the list to view details</p>
            </div>
          )}
          <BusList buses={buses} className="h-[40vh]" onSelectBus={handleSelectBus} />
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            <BusMap buses={onlineBuses} /> {/* Pass only online buses to map */}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 bg-white/95 backdrop-blur-xl overflow-y-auto md:hidden">
            <div className="p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Menu</h2>
                <button
                  className="p-2 text-gray-600"
                  onClick={toggleMobileMenu}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex border-b border-gray-200">
                <button
                  className={`flex-1 py-2 text-sm font-medium ${activeTab === 'buses' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('buses')}
                >
                  Buses
                </button>
                <button
                  className={`flex-1 py-2 text-sm font-medium ${activeTab === 'routes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
                  onClick={() => setActiveTab('routes')}
                >
                  Routes
                </button>
              </div>

              {selectedBus ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Bus Details</h3>
                    <p className="text-base font-medium">{selectedBus.bus_number}</p>
                    <p className="text-sm text-gray-500">{selectedBus.route_name || 'No Route'}</p>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-500">Additional Info</h3>
                    <p className="text-base font-medium">Model: {selectedBus.bus_model || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Route: {selectedBus.route_number || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  <p>Select a bus to view details</p>
                </div>
              )}

              <div className={activeTab === 'buses' ? 'block' : 'hidden'}>
                <BusList buses={buses} className="h-[40vh]" onSelectBus={handleSelectBus} />
              </div>
              <div className={activeTab === 'routes' ? 'block' : 'hidden'}>
                <ActiveRoutes className="h-[40vh]" isExpanded={isRoutesExpanded} buses={onlineBuses} />
              </div>

              <div className="flex flex-col space-y-2">
                <Link to="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    <LogIn className="h-4 w-4 mr-2" />
                    Driver Login
                  </Button>
                </Link>
                <Link to="/register" className="w-full">
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer with Active Routes (Mobile Only) */}
      <footer ref={footerRef} className="bg-white/80 backdrop-blur-xl border-t border-gray-200 py-3 px-4">
        <div className="flex flex-col gap-2">
          <div className="text-center text-sm text-gray-500">
            <p>Near To You • {onlineBuses.length} buses online</p>
          </div>
          <div className="md:hidden">
            <ActiveRoutes
              className={cn(
                isRoutesExpanded ? 'h-[50vh]' : 'h-[20vh]',
                'overflow-y-auto transition-all duration-300 ease-in-out'
              )}
              isExpanded={isRoutesExpanded}
              buses={onlineBuses} // Pass only online buses
            />
          </div>
        </div>
      </footer>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 md:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </div>
  );
};

export default Index;
