import { useState } from "react";
import AdminLayout from "@/components/layout/admin-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, RefreshCcw, Info, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useRef } from "react";

interface ScormPackage {
  id: number;
  title: string;
  description: string;
  version: string;
  entryPoint: string;
  createdAt: string;
}

const scormUploadSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  scormPackage: z.any()
});

export default function ScormPackagesPage() {
  const { toast } = useToast();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const form = useForm<z.infer<typeof scormUploadSchema>>({
    resolver: zodResolver(scormUploadSchema),
    defaultValues: {
      title: "",
      description: ""
    },
  });
  
  const { data: scormPackages, isLoading, refetch } = useQuery<ScormPackage[]>({
    queryKey: ["/api/scorm-packages"],
    queryFn: async () => {
      const response = await fetch("/api/scorm-packages");
      if (!response.ok) {
        throw new Error("Failed to fetch SCORM packages");
      }
      return response.json();
    },
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/scorm-packages/upload", data, null, null, true);
    },
    onSuccess: () => {
      toast({
        title: "SCORM Package Uploaded",
        description: "The SCORM package has been successfully uploaded.",
        duration: 3000,
      });
      setIsUploadDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/scorm-packages"] });
    },
    onError: (error) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload SCORM package",
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!isUploadDialogOpen) {
      form.reset();
    }
  }, [isUploadDialogOpen, form]);
  
  const onSubmit = (values: z.infer<typeof scormUploadSchema>) => {
    const formData = new FormData();
    
    // Add optional title and description
    if (values.title) {
      formData.append("title", values.title);
    }
    
    if (values.description) {
      formData.append("description", values.description);
    }
    
    // Add the file
    if (fileInputRef.current?.files?.[0]) {
      formData.append("scormPackage", fileInputRef.current.files[0]);
      uploadMutation.mutate(formData);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a SCORM package file (ZIP format) to upload.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-abu-charcoal">SCORM Packages</h1>
            <p className="text-muted-foreground">Manage SCORM compliant learning content</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="flex items-center gap-1"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
            
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload SCORM Package
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload SCORM Package</DialogTitle>
                  <DialogDescription>
                    Upload a SCORM compliant package (.zip file) to add interactive learning content.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Package title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormItem>
                      <FormLabel>SCORM Package (ZIP file)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".zip" 
                          ref={fileInputRef}
                          onChange={(e) => {
                            // If the package has a title that's automatically extracted from the zip,
                            // the optional title field will be overridden
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  
                    <div className="p-3 bg-amber-50 text-amber-800 rounded text-sm flex items-start gap-2 mt-4">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Important Notes:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>The package must be a valid SCORM 1.2 or 2004 compliant ZIP file</li>
                          <li>The ZIP must contain an 'imsmanifest.xml' file in its root</li>
                          <li>Maximum file size: 50MB</li>
                        </ul>
                      </div>
                    </div>
                    
                    <DialogFooter className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-white"
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>Upload Package</>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : scormPackages && scormPackages.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scormPackages.map((pkg) => (
              <Card key={pkg.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="line-clamp-1">{pkg.title}</CardTitle>
                  <CardDescription>Version: {pkg.version}</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {pkg.description || "No description available"}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Entry point: {pkg.entryPoint || "index.html"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-2 pb-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      toast({
                        title: "Preview Feature",
                        description: "SCORM package preview will be available soon.",
                      });
                    }}
                  >
                    Preview Package
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No SCORM packages available</h3>
            <p className="text-muted-foreground mt-1 mb-6 max-w-md">
              Upload SCORM packages to create interactive learning experiences for your courses.
            </p>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Package
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Upload SCORM Package</DialogTitle>
                  <DialogDescription>
                    Upload a SCORM compliant package (.zip file) to add interactive learning content.
                  </DialogDescription>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Package title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Brief description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormItem>
                      <FormLabel>SCORM Package (ZIP file)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".zip" 
                          ref={fileInputRef}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  
                    <div className="p-3 bg-amber-50 text-amber-800 rounded text-sm flex items-start gap-2 mt-4">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Important Notes:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>The package must be a valid SCORM 1.2 or 2004 compliant ZIP file</li>
                          <li>The ZIP must contain an 'imsmanifest.xml' file in its root</li>
                          <li>Maximum file size: 50MB</li>
                        </ul>
                      </div>
                    </div>
                    
                    <DialogFooter className="mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-primary hover:bg-primary/90 text-white"
                        disabled={uploadMutation.isPending}
                      >
                        {uploadMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>Upload Package</>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}