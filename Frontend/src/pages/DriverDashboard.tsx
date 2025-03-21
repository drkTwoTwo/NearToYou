import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus, LogOut, Map, Route as RouteIcon } from "lucide-react";
import { toast } from "sonner";
import { useWebSocketBuses } from "@/hooks/useWebSocketBuses";

const DriverDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [driverData, setDriverData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { status, error, connect } = useWebSocketBuses();

  // Load driver details
  useEffect(() => {
    console.log("Loading driver data...");
    const storedDriver = localStorage.getItem("driverDetails");
    if (location.state?.driverDetails) {
      console.log("Driver data from location.state:", location.state.driverDetails);
      setDriverData(location.state.driverDetails);
      localStorage.setItem("driverDetails", JSON.stringify(location.state.driverDetails));
    } else if (storedDriver) {
      console.log("Driver data from localStorage:", JSON.parse(storedDriver));
      setDriverData(JSON.parse(storedDriver));
    } else {
      console.log("No driver data available");
    }
    setLoading(false);
  }, [location.state]);

  // WebSocket status feedback
  useEffect(() => {
    console.log("WebSocket status:", status, "error:", error);
    if (status === "connected") {
      toast.success("Connected to bus tracking server", {
        description: "Ready to share location updates.",
      });
    } else if (status === "disconnected" && error) {
      toast.error("Connection lost", {
        description: error.message,
      });
    }
  }, [status, error]);

  // Tracking logic
  useEffect(() => {
    console.log("Tracking effect running - isTracking:", isTracking, "status:", status, "driverData:", driverData);
    if (!driverData || !driverData.bus_details?.bus_number) {
      console.log("Missing driverData or bus_number, skipping tracking");
      return;
    }

    if (isTracking) {
      if (status === "connected") {
        console.log("Starting tracking for bus:", driverData.bus_details.bus_number);
        window.startTracking(driverData.bus_details.bus_number);
        toast.success("Tracking started", {
          description: "Your location is now being shared.",
        });
      } else {
        console.log("WebSocket not connected, status:", status);
        toast.error("WebSocket not connected", {
          description: "Attempting to reconnect...",
        });
        setIsTracking(false);
        connect();
      }
    } else {
      if (typeof window.stopTracking === "function") {
        console.log("Stopping tracking...");
        window.stopTracking();
        toast.info("Tracking stopped", {
          description: "Your location is no longer being shared.",
        });
      }
    }

    return () => {
      if (typeof window.stopTracking === "function" && isTracking) {
        console.log("Cleanup: stopping tracking");
        window.stopTracking();
      }
    };
  }, [isTracking, driverData, status, connect]);

  const toggleTracking = () => {
    console.log("Toggle tracking clicked, current isTracking:", isTracking, "status:", status);
    setIsTracking((prev) => {
      const newValue = !prev;
      console.log("New isTracking value:", newValue);
      return newValue;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("driverDetails");
    localStorage.removeItem("token");
    if (typeof window.stopTracking === "function") {
      window.stopTracking();
    }
    navigate("/login");
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!driverData) return <p className="text-center text-red-500">No driver details found.</p>;

  const busDetails = driverData.bus_details || {};

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Fixed Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 py-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Driver Dashboard</h1>
          <Link to="/login">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </Link>
        </div>
      </header>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto pt-20 px-4 pb-8"> {/* pt-20 offsets header height */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Driver Information</CardTitle>
                <CardDescription>Your profile and bus details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-center">
                  <h3 className="text-sm font-medium text-gray-500">Personal Information</h3>
                  {driverData.bus_icon ? (
                    <img
                      src={driverData.bus_icon}
                      alt="Bus Icon"
                      className="h-16 w-16 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <Bus className="h-16 w-16 text-gray-500 mx-auto" />
                  )}
                  <p className="text-base font-medium">{driverData.name || "Unknown Name"}</p>
                  <p className="text-sm text-gray-500">ID: {driverData.id || "N/A"}</p>
                  <p className="text-sm text-gray-500">{driverData.email || "No Email"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Bus Information</h3>
                  <div className="flex items-center space-x-2">
                    <Bus className="h-4 w-4 text-gray-500" />
                    <span className="text-base font-medium">{busDetails.bus_number || "No Bus Assigned"}</span>
                  </div>
                  <p className="text-sm text-gray-500">Model: {driverData.bus_model || "Unknown Model"}</p>
                  <div className="flex items-center space-x-2">
                    <RouteIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Route Number: {driverData.route_number || "No Route Assigned"}</span>
                  </div>
                  <p className="text-sm text-gray-500">Route Name: {busDetails.route_name || "N/A"}</p>
                  <p className="text-sm text-gray-500">Last Updated: {busDetails.last_updated || "N/A"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Current Location</h3>
                  <p className="text-sm text-gray-500">
                    Lat: {busDetails.current_lat ?? "N/A"}, Lng: {busDetails.current_lon ?? "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-500">Route Details</h3>
                  <p className="text-sm text-gray-500 truncate">From: {busDetails.from_address || "N/A"}</p>
                  <p className="text-sm text-gray-500">
                    (Lat: {busDetails.from_lat ?? "N/A"}, Lng: {busDetails.from_lng ?? "N/A"})
                  </p>
                  <p className="text-sm text-gray-500 truncate">To: {busDetails.to_address || "N/A"}</p>
                  <p className="text-sm text-gray-500">
                    (Lat: {busDetails.to_lat ?? "N/A"}, Lng: {busDetails.to_lng ?? "N/A"})
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Location Tracking</CardTitle>
                <CardDescription>Control your real-time location sharing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-6">
                  <div className="text-center">
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 ${isTracking ? "bg-green-100" : "bg-gray-100"}`}>
                      <Map className={`h-12 w-12 ${isTracking ? "text-green-500" : "text-gray-400"}`} />
                    </div>
                    <h3 className="text-lg font-medium mb-2">
                      {isTracking ? "Location Tracking Active" : "Location Tracking Inactive"}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {isTracking
                        ? "Your bus location is being shared in real-time."
                        : "Enable tracking to share your bus location with passengers."}
                    </p>
                    <Button
                      onClick={toggleTracking}
                      variant={isTracking ? "destructive" : "default"}
                      className="min-w-[150px]"
                      disabled={status === "connecting"}
                    >
                      {isTracking ? "Stop Tracking" : "Start Tracking"}
                    </Button>
                    {error && <p className="text-sm text-red-500 mt-2">Error: {error.message}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDashboard;
