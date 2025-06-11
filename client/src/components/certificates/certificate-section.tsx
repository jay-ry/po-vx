import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Certificate, Course } from '@shared/schema';

type CertificateWithCourse = Certificate & { 
  course?: Course;
  user?: { id: number; name: string; };
};

export function CertificateSection() {
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateWithCourse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Force invalidate cache on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/certificates'] });
  }, [queryClient]);

  const { data: certificates, isLoading } = useQuery<CertificateWithCourse[]>({
    queryKey: ['/api/certificates'],
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleViewCertificate = (certificate: CertificateWithCourse) => {
    console.log('Certificate data:', certificate);
    console.log('User data:', certificate.user);
    setSelectedCertificate(certificate);
    setDialogOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="font-heading text-xl font-semibold text-neutrals-800 mb-4">My Certificates</h2>
      
      {isLoading ? (
        // Loading state
        <div className="space-y-4">
          {Array(2).fill(0).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-4 w-60" />
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : certificates && certificates.length > 0 ? (
        // Certificates list
        <div className="space-y-4">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{certificate.course?.name || 'Certificate'}</CardTitle>
                <CardDescription>
                  Certificate #{certificate.certificateNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <div className="flex gap-2 items-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {certificate.status === 'active' ? 'Valid' : 'Expired'}
                  </Badge>
                  <span className="text-sm text-neutrals-500">
                    Issued: {certificate.createdAt ? format(new Date(certificate.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </span>
                </div>
                <Button variant="outline" onClick={() => handleViewCertificate(certificate)}>
                  View Certificate
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty state
        <div className="flex flex-col items-center justify-center p-8 text-center bg-neutrals-50 rounded-lg">
          <span className="material-icons text-4xl text-neutrals-400 mb-3">school</span>
          <h3 className="font-medium text-neutrals-800 mb-2">No certificates yet</h3>
          <p className="text-sm text-neutrals-600 mb-4">Complete courses to earn certificates of achievement</p>
        </div>
      )}

      {/* Certificate Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Certificate of Completion</DialogTitle>
            <DialogDescription>
              {selectedCertificate?.course?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCertificate && (
            <div className="bg-[#f9f9f9] border-8 border-double border-primary/20 p-8 rounded-lg shadow-lg">
              <div className="certificate-container relative flex flex-col items-center text-center p-6 bg-white">
                {/* Decorative corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-md"></div>
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-md"></div>
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-md"></div>
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-md"></div>
                
                {/* Logo */}
                <div className="mb-2">
                  <img src="/images/Logo-EHC-1.svg" alt="Eastern Health Cluster Logo" className="h-16 mx-auto" />
                </div>
                
                <div className="certificate-header border-b-2 border-primary pb-4 mb-6 w-full">
                  <h1 className="text-2xl font-bold text-primary mb-1">VX Academy</h1>
                  <p className="text-lg text-neutrals-800">Certificate of Completion</p>
                </div>
                
                <div className="certificate-body mb-8">
                  <p className="text-lg mb-2">This is to certify that</p>
                  <h2 className="text-3xl font-semibold mb-4 text-primary">{selectedCertificate.user?.name || 'User'}</h2>
                  <p className="text-lg mb-1">has successfully completed</p>
                  <h3 className="text-xl font-bold mb-4">{selectedCertificate.course?.name}</h3>
                  <p className="text-md mb-4">Certificate ID: {selectedCertificate.certificateNumber}</p>
                  <p className="text-md">
                    Issued on: {selectedCertificate.createdAt 
                      ? format(new Date(selectedCertificate.createdAt), 'MMMM d, yyyy') 
                      : 'N/A'}
                  </p>
                </div>
                
                {/* Signature Line */}
                <div className="w-48 border-t border-gray-400 mt-6 pt-2">
                  <p className="text-sm text-neutrals-600">Director, VX Academy</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button>Download PDF</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}