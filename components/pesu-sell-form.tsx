"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Camera, 
  MapPin, 
  DollarSign, 
  Package, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { APIClient } from "@/lib/api-client";

const categories = [
  { value: "Electronics", label: "Electronics", icon: "📱" },
  { value: "Books", label: "Books", icon: "📚" },
  { value: "Furniture", label: "Furniture", icon: "🪑" },
  { value: "Clothing", label: "Clothing", icon: "👔" },
  { value: "Sports", label: "Sports & Fitness", icon: "⚽" },
  { value: "Stationery", label: "Stationery", icon: "✏️" },
  { value: "Vehicles", label: "Vehicles", icon: "🚲" },
  { value: "Other", label: "Other", icon: "📦" }
];

const conditions = [
  { value: "New", label: "Brand New", description: "Never used, with original packaging" },
  { value: "Like New", label: "Like New", description: "Barely used, excellent condition" },
  { value: "Good", label: "Good", description: "Some signs of use but works perfectly" },
  { value: "Fair", label: "Fair", description: "Noticeable wear but fully functional" },
  { value: "Poor", label: "Poor", description: "Heavy wear or minor issues" }
];

export function SellFormContents() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    condition: "",
    location: user?.profile.campus || "",
    images: [] as File[],
    contactMethod: "chat", // chat, phone, email
    phone: user?.profile.phone || "",
    email: user?.email || "",
    negotiable: true,
    urgent: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string | boolean | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (formData.images.length + files.length > 5) {
      setErrors(prev => ({ ...prev, images: "Maximum 5 images allowed" }));
      return;
    }
    
    handleInputChange("images", [...formData.images, ...files]);
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    handleInputChange("images", newImages);
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters long";
    } else if (formData.title.trim().length > 100) {
      newErrors.title = "Title must be less than 100 characters";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters long";
    } else if (formData.description.trim().length > 1000) {
      newErrors.description = "Description must be less than 1000 characters";
    }
    
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.condition) newErrors.condition = "Condition is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (formData.images.length === 0) newErrors.images = "At least one image is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    
    setIsSubmitting(true);
    try {
      // File size validation
      const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
      for (const file of formData.images) {
        if (file.size > MAX_IMAGE_SIZE) {
          setErrors({ submit: `One or more images exceed the maximum size of 5MB.` });
          setIsSubmitting(false);
          return;
        }
      }
      // Convert images to base64 in parallel
      const imageUrls: string[] = await Promise.all(
        formData.images.map(
          (file) =>
            new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            })
        )
      );

      // Prepare the item data for submission
      const itemData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        images: imageUrls, // Use converted image URLs
        seller_id: user?.id, // Use the UUID from PESU auth
        is_available: true,
        views: 0,
      };

      // Submit to the items API using the API client
      const apiClient = new APIClient();
      await apiClient.createItem(itemData);
      
      router.push("/item-listing?success=true");
    } catch (error) {
      console.error("Error listing item:", error);
      setErrors({ submit: error instanceof Error ? error.message : "Failed to list item. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Package className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Item Details</h2>
        <p className="text-muted-foreground">Tell us about what you&apos;re selling</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Item Title *</Label>
          <Input
            id="title"
            placeholder="e.g., iPhone 13 Pro Max"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
        </div>

        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            placeholder="Describe your item in detail..."
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className={`min-h-32 ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description}</p>}
        </div>

        <div>
          <Label>Category *</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => handleInputChange("category", cat.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  formData.category === cat.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-lg mb-1">{cat.icon}</div>
                <div className="text-sm font-medium">{cat.label}</div>
              </button>
            ))}
          </div>
          {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
        </div>

        <div>
          <Label>Condition *</Label>
          <div className="space-y-2 mt-2">
            {conditions.map((cond) => (
              <div
                key={cond.value}
                onClick={() => handleInputChange("condition", cond.value)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  formData.condition === cond.value
                    ? "border-primary bg-primary/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="font-medium">{cond.label}</div>
                <div className="text-sm text-muted-foreground">{cond.description}</div>
              </div>
            ))}
          </div>
          {errors.condition && <p className="text-sm text-red-500 mt-1">{errors.condition}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <DollarSign className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Pricing & Location</h2>
        <p className="text-muted-foreground">Set your price and location details</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="price">Price (₹) *</Label>
          <Input
            id="price"
            type="number"
            placeholder="e.g., 25000"
            value={formData.price}
            onChange={(e) => handleInputChange("price", e.target.value)}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
          
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="checkbox"
              id="negotiable"
              checked={formData.negotiable}
              onChange={(e) => handleInputChange("negotiable", e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="negotiable" className="text-sm">Price is negotiable</Label>
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location *</Label>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Input
              id="location"
              placeholder={`${user?.profile.campus} Campus`}
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className={errors.location ? "border-red-500" : ""}
            />
          </div>
          {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location}</p>}
        </div>

        <div>
          <Label>Images * (Max 5)</Label>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">Click to upload images</p>
                <p className="text-sm text-muted-foreground">PNG, JPG up to 10MB each</p>
              </label>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {formData.images.map((file, index) => (
                  <div key={index} className="relative">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      width={100}
                      height={100}
                      className="rounded-lg object-cover w-full h-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.images && <p className="text-sm text-red-500 mt-1">{errors.images}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Review & Publish</h2>
        <p className="text-muted-foreground">Review your listing before publishing</p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-lg">{formData.title}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            {formData.category}
          </span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {formData.condition}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {formData.location}
          </span>
        </div>
        <p className="text-2xl font-bold text-primary">₹{formData.price}</p>
        <p className="text-muted-foreground">{formData.description}</p>
        
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Seller Information</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p><strong>Name:</strong> {user?.name}</p>
            <p><strong>SRN:</strong> {user?.srn}</p>
            <p><strong>Campus:</strong> {user?.profile.campus} Campus</p>
            <p><strong>Branch:</strong> {user?.profile.branch}</p>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        </div>
      )}
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step <= currentStep
                ? "bg-primary text-white"
                : "bg-gray-200 text-gray-600"
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-1 ${
                step < currentStep ? "bg-primary" : "bg-gray-200"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={handleNextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Publishing..." : "Publish Listing"}
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SellFormContents;
