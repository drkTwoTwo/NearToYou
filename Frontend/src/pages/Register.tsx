import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Bus, Upload } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Confirm password is required" }),
  busId: z.string().min(1, { message: "Bus ID is required" }),
  busModel: z.string().min(1, { message: "Bus model is required" }),
  routeNumber: z.string().min(1, { message: "Route number is required" }),
  fromLocation: z.object({
    address: z.string().min(1, { message: "Starting location is required" }),
    lat: z.number(),
    lng: z.number(),
  }),
  toLocation: z.object({
    address: z.string().min(1, { message: "Destination location is required" }),
    lat: z.number(),
    lng: z.number(),
  }),
  busIcon: z.any().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      busId: "",
      busModel: "",
      routeNumber: "",
      fromLocation: { address: "", lat: 0, lng: 0 },
      toLocation: { address: "", lat: 0, lng: 0 },
      busIcon: null,
    },
  });

  const searchLocation = async (query, setSuggestions) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.map(item => ({
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      })));
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("busId", data.busId);
      formData.append("busModel", data.busModel);
      formData.append("routeNumber", data.routeNumber);
      formData.append("fromAddress", data.fromLocation.address);
      formData.append("fromLat", data.fromLocation.lat.toString());
      formData.append("fromLng", data.fromLocation.lng.toString());
      formData.append("toAddress", data.toLocation.address);
      formData.append("toLat", data.toLocation.lat.toString());
      formData.append("toLng", data.toLocation.lng.toString());
      if (data.busIcon) {
        formData.append("busIcon", data.busIcon);
      }

      console.log("Sending FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch("/api/register/", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Server Response:", result);

      if (response.ok) {
        toast.success("Registration successful", {
          description: "Your account has been created!",
        });
        setTimeout(() => navigate("/login"), 1500);
      } else {
        toast.error("Registration failed", {
          description: result?.message || "Please check your details.",
        });
      }
    } catch (error) {
      console.error("Submission Error:", error);
      toast.error("Error", { description: "Something went wrong!" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-lg shadow-lg mx-auto my-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <CardHeader className="space-y-4 border-b pb-4">
          <div className="flex items-center justify-center">
            <Form {...form}>
              <FormField
                control={form.control}
                name="busIcon"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem className="text-center">
                    <FormControl>
                      <div className="relative group">
                        <div className="h-20 w-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {value ? (
                            <img
                              src={URL.createObjectURL(value)}
                              alt="Bus icon preview"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Bus className="h-10 w-10 text-gray-400" />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                          <Upload className="h-6 w-6 text-white" />
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => onChange(e.target.files?.[0])}
                            className="hidden"
                            {...field}
                          />
                        </label>
                      </div>
                    </FormControl>
                    <FormLabel className="mt-2 block text-sm font-medium text-gray-700">
                      Select Bus Icon (Optional)
                    </FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">Driver Registration</CardTitle>
            <CardDescription>
              Register as a bus driver to start tracking your routes
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500">Personal Information</h3>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="driver@busberry.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bus Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-gray-500">Bus Information</h3>
                  <FormField
                    control={form.control}
                    name="busId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus ID</FormLabel>
                        <FormControl>
                          <Input placeholder="BUS-12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="busModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bus Model</FormLabel>
                        <FormControl>
                          <Input placeholder="City Express X2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="routeNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Route Number</FormLabel>
                        <FormControl>
                          <Input placeholder="42A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter starting location"
                              value={field.value.address}
                              onChange={(e) => {
                                field.onChange({ ...field.value, address: e.target.value });
                                searchLocation(e.target.value, setFromSuggestions);
                              }}
                            />
                            {fromSuggestions.length > 0 && (
                              <ul className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                                {fromSuggestions.map((suggestion, index) => (
                                  <li
                                    key={index}
                                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      field.onChange(suggestion);
                                      setFromSuggestions([]);
                                    }}
                                  >
                                    {suggestion.address}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              placeholder="Enter destination location"
                              value={field.value.address}
                              onChange={(e) => {
                                field.onChange({ ...field.value, address: e.target.value });
                                searchLocation(e.target.value, setToSuggestions);
                              }}
                            />
                            {toSuggestions.length > 0 && (
                              <ul className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                                {toSuggestions.map((suggestion, index) => (
                                  <li
                                    key={index}
                                    className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      field.onChange(suggestion);
                                      setToSuggestions([]);
                                    }}
                                  >
                                    {suggestion.address}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" disabled={form.formState.isSubmitting}>
                <UserPlus className="mr-2 h-4 w-4" />
                Register
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-gray-500 mt-2">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </div>
          <Link to="/" className="text-sm text-center text-gray-500 hover:underline">
            Back to home
          </Link>
        </CardFooter>
      </Card>
      <div className="text-center text-xs text-gray-500 mt-2">
        Location data provided by <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">OpenStreetMap</a> and <a href="https://nominatim.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="underline">Nominatim</a>
      </div>
    </div>
  );
};

export default Register;
