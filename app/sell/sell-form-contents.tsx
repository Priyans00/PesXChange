"use client";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import DOMPurify from "dompurify";
import { 
  Upload, 
  X, 
  Camera, 
  MapPin, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star,
  Shield,
  FileText
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

// Input validation functions
const validateTitle = (title: string): string | null => {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return "Title is required";
  if (trimmedTitle.length < 3) return "Title must be at least 3 characters";
  if (trimmedTitle.length > 100) return "Title must be less than 100 characters";
  // Check for suspicious patterns
  if (trimmedTitle.match(/[<>]/)) return "Title contains invalid characters";
  return null;
};

const validateDescription = (description: string): string | null => {
  const trimmedDescription = description.trim();
  if (!trimmedDescription) return "Description is required";
  if (trimmedDescription.length < 10) return "Description must be at least 10 characters";
  if (trimmedDescription.length > 500) return "Description must be less than 500 characters";
  // Check for suspicious patterns
  if (trimmedDescription.match(/<script|javascript:|on\w+=/i)) return "Description contains invalid content";
  return null;
};

const validatePrice = (price: string): string | null => {
  if (!price.trim()) return "Price is required";
  const numPrice = Number(price);
  if (isNaN(numPrice)) return "Please enter a valid number";
  if (numPrice <= 0) return "Price must be greater than 0";
  if (numPrice > 10000000) return "Price seems too high";
  return null;
};

const validateYear = (year: string): string | null => {
  if (!year.trim()) return null; // Optional field
  const numYear = Number(year);
  if (isNaN(numYear)) return "Please enter a valid year";
  const currentYear = new Date().getFullYear();
  if (numYear < 1900 || numYear > currentYear) return `Year must be between 1900 and ${currentYear}`;
  return null;
};

export function SellFormContents({ user }: SellFormContentsProps) {
  // Legacy component - user parameter preserved for compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _user = user;
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

  // Memoized validation functions
  const validationResults = useMemo(() => ({
    title: validateTitle(formData.title),
    description: validateDescription(formData.description),
    price: validatePrice(formData.price),
    year: validateYear(formData.year),
    images: images.length === 0 ? "At least one image is required" : null
  }), [formData, images]);

  const handleInputChange = useCallback((field: string, value: string) => {
    // Client-side XSS sanitization using DOMPurify
    let sanitizedValue = value;
    
    // Check if we're in the browser (not SSR)
    if (typeof window !== 'undefined') {
      sanitizedValue = DOMPurify.sanitize(value, { 
        ALLOWED_TAGS: [],  // Strip all HTML tags
        ALLOWED_ATTR: []   // Strip all attributes
      });
    } else {
      // Fallback server-side sanitization
      sanitizedValue = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }
    
    setFormData(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  }, [errors]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_IMAGES = 8;

    Array.from(files).forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, images: "Only image files are allowed" }));
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setErrors(prev => ({ ...prev, images: "Images must be less than 10MB" }));
        return;
      }

      // Check total image count
      if (images.length >= MAX_IMAGES) {
        setErrors(prev => ({ ...prev, images: `Maximum ${MAX_IMAGES} images allowed` }));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, result];
        });
        // Clear images error when user adds an image
        if (errors.images) {
          setErrors(prev => ({ ...prev, images: "" }));
        }
      };
      reader.readAsDataURL(file);
    });
  }, [images.length, errors.images]);

  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (validationResults.images) {
        newErrors.images = validationResults.images;
      }
    } else if (step === 2) {
      if (validationResults.title) newErrors.title = validationResults.title;
      if (validationResults.description) newErrors.description = validationResults.description;
    } else if (step === 3) {
      if (validationResults.price) newErrors.price = validationResults.price;
      if (validationResults.year) newErrors.year = validationResults.year;
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
    setErrors({}); // Clear errors when going back
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        condition: formData.condition,
        year: formData.year.trim() ? Number(formData.year) : null,
        location: formData.location.trim(),
        images: images
      };

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setCurrentStep(4); // Success step
        setTimeout(() => {
          router.push("/item-listing?success=true");
        }, 2000);
      } else {
        const data = await response.json().catch(() => ({}));
        if (response.status === 401) {
          setErrors({ submit: "Please log in again to continue" });
        } else if (response.status === 429) {
          setErrors({ submit: "Too many requests. Please wait a moment." });
        } else {
          setErrors({ submit: data.error || "Failed to create item" });
        }
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
                    JPG, PNG up to 10MB each (max 8 images)
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
                  <div className="flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.images}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <Button onClick={nextStep} className="px-8 py-3 text-lg" disabled={images.length === 0}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="p-8">
              <div className="text-center mb-8">
                <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Item Details
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Provide accurate details to attract the right buyers.
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    type="text"
                    placeholder="iPhone 13 Pro - Excellent Condition"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`text-lg py-3 ${errors.title ? "border-red-500" : ""}`}
                    maxLength={100}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.title ? (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.title}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.title.length}/100 characters
                    </p>
                  </div>
                </div>

                {/* Category */}
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
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.category === category.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{category.icon}</div>
                        <div className="text-sm font-medium">{category.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 block">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item's condition, features, and any included accessories..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={`min-h-[120px] text-base ${errors.description ? "border-red-500" : ""}`}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description ? (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.description}
                      </p>
                    ) : (
                      <span></span>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formData.description.length}/500 characters
                    </p>
                  </div>
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
                      min="1"
                      max="10000000"
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
