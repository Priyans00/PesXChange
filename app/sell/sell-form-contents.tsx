"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import { 
  Upload, 
  X, 
  Camera, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Package, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface SellFormContentsProps {
  user: User;
}

const categories = [
  { value: "Electronics", label: "Electronics", icon: "📱" },
  { value: "Books", label: "Books", icon: "📚" },
  { value: "Clothing", label: "Clothing", icon: "👕" },
  { value: "Furniture", label: "Furniture", icon: "🛋️" },
  { value: "Sports", label: "Sports", icon: "⚽" },
  { value: "Vehicles", label: "Vehicles", icon: "🚗" },
  { value: "Others", label: "Others", icon: "📦" }
];

const conditions = [
  { value: "New", label: "Brand New", description: "Never used, original packaging" },
  { value: "Like New", label: "Like New", description: "Barely used, excellent condition" },
  { value: "Good", label: "Good", description: "Used but well maintained" },
  { value: "Fair", label: "Fair", description: "Shows signs of wear but functional" }
];

export function SellFormContents({ user }: SellFormContentsProps) {
  console.log("Current user:", user?.email); // Use user to prevent unused variable warning
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    category: "Electronics",
    condition: "Good",
    year: "",
    location: "PES University, Bangalore"
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImages(prev => [...prev, result]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (images.length === 0) {
        newErrors.images = "At least one image is required";
      }
    } else if (step === 2) {
      if (!formData.title.trim()) {
        newErrors.title = "Title is required";
      }
      if (!formData.description.trim()) {
        newErrors.description = "Description is required";
      }
    } else if (step === 3) {
      if (!formData.price.trim()) {
        newErrors.price = "Price is required";
      } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        newErrors.price = "Please enter a valid price";
      }
      if (formData.year && (isNaN(Number(formData.year)) || Number(formData.year) < 1900 || Number(formData.year) > new Date().getFullYear())) {
        newErrors.year = "Please enter a valid year";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);

    try {
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          price: Number(formData.price),
          year: formData.year ? Number(formData.year) : null,
          images: images
        }),
      });

      if (response.ok) {
        setCurrentStep(4); // Success step
        setTimeout(() => {
          router.push("/item-listing?success=true");
        }, 2000);
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || "Failed to create item" });
      }
    } catch (error) {
      console.error("Error creating item:", error);
      setErrors({ submit: "An error occurred while creating the item" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Sell Your Item
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                List your item and reach thousands of PES University students
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Shield className="h-4 w-4" />
              <span>Secure & Trusted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600 dark:text-gray-400">
            <span>Photos</span>
            <span>Details</span>
            <span>Pricing</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden">
          
          {/* Step 1: Photos */}
          {currentStep === 1 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <Camera className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Add Photos of Your Item
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Good photos help your item sell faster. Add up to 8 photos.
                </p>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Click to upload photos
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    or drag and drop images here
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    JPG, PNG up to 10MB each
                  </div>
                </label>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Your Photos ({images.length}/8)
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <Image
                          src={image}
                          alt={`Preview ${index + 1}`}
                          width={200}
                          height={150}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-2 left-2">
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                              Main Photo
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.images && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.images}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <Button 
                  onClick={nextStep} 
                  disabled={images.length === 0}
                  className="px-8 py-3 text-lg"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Item Details */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <Package className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Tell Us About Your Item
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Provide detailed information to attract more buyers
                </p>
              </div>

              <div className="space-y-6">
                {/* Category Selection */}
                <div>
                  <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 block">
                    Category
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleInputChange("category", category.value)}
                        className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                          formData.category === category.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {category.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
                    Item Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="e.g., iPhone 13 Pro Max - 256GB, Space Gray"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`text-lg py-3 ${errors.title ? "border-red-500" : ""}`}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item&apos;s condition, features, accessories included, reason for selling, etc. Be honest and detailed to build trust with buyers."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={`text-base ${errors.description ? "border-red-500" : ""}`}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.description}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Condition */}
                <div>
                  <Label className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 block">
                    Condition
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conditions.map((condition) => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={() => handleInputChange("condition", condition.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.condition === condition.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {condition.label}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {condition.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label htmlFor="location" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    className="text-lg py-3"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="px-8 py-3">
                  Back
                </Button>
                <Button onClick={nextStep} className="px-8 py-3 text-lg">
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {currentStep === 3 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Set Your Price
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Price it right to sell faster. You can always adjust later.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-6">
                {/* Price */}
                <div>
                  <Label htmlFor="price" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
                    Selling Price *
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">₹</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="5000"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className={`text-2xl py-4 pl-8 text-center font-bold ${errors.price ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.price}
                    </p>
                  )}
                  
                  {/* Price Tips */}
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">💡 Pricing Tips</h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Research similar items to set competitive prices</li>
                      <li>• Consider the item&apos;s age and condition</li>
                      <li>• Slightly higher prices allow room for negotiation</li>
                    </ul>
                  </div>
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor="year" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Purchase Year (Optional)
                  </Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="2023"
                    value={formData.year}
                    onChange={(e) => handleInputChange("year", e.target.value)}
                    className="text-lg py-3 text-center"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                  {errors.year && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center justify-center">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.year}
                    </p>
                  )}
                </div>
              </div>

              {errors.submit && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={prevStep} className="px-8 py-3">
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="px-8 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {loading ? "Publishing..." : "Publish Item"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Item Listed Successfully!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your item is now live and visible to thousands of PES University students.
                </p>
                
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                    What happens next?
                  </h3>
                  <ul className="text-sm text-green-800 dark:text-green-200 space-y-2 text-left">
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Your item will appear in search results
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      Interested buyers can message you directly
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 mr-2" />
                      You&apos;ll receive notifications for inquiries
                    </li>
                  </ul>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirecting to your listings...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}