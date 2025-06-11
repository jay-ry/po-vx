import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Badge types
type BadgeType = "assessment" | "course_completion" | "area_completion" | "special";

export function BadgesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [formData, setFormData] = useState<Partial<Badge>>({
    name: "",
    description: "",
    imageUrl: "",
    xpPoints: 0,
    type: "assessment"
  });

  const { data: badges, isLoading } = useQuery<Badge[]>({
    queryKey: ["/api/badges"],
    refetchOnWindowFocus: false,
  });

  const updateBadgeMutation = useMutation({
    mutationFn: async (badge: Partial<Badge>) => {
      const res = await apiRequest("PATCH", `/api/admin/badges/${selectedBadge?.id}`, badge);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Badge updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (badge: Partial<Badge>) => {
      const res = await apiRequest("POST", "/api/admin/badges", badge);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Badge created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (badge: Badge) => {
    setSelectedBadge(badge);
    setFormData({
      name: badge.name,
      description: badge.description,
      imageUrl: badge.imageUrl,
      xpPoints: badge.xpPoints,
      type: badge.type
    });
    setIsEditDialogOpen(true);
  };

  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      imageUrl: "https://img.icons8.com/fluent/96/000000/medal.png",
      xpPoints: 50,
      type: "assessment"
    });
    setIsCreateDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "xpPoints" ? parseInt(value) : value,
    }));
  };

  const handleTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      type: value as BadgeType,
    }));
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBadgeMutation.mutate(formData);
  };

  const handleSubmitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createBadgeMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-4">Loading badges...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Badges Management</h2>
        <Button onClick={handleCreateNew}>Create New Badge</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges?.map((badge) => (
          <div
            key={badge.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col"
          >
            <div className="flex items-center mb-4">
              <img
                src={badge.imageUrl || "https://placehold.co/96x96"}
                alt={badge.name}
                className="w-12 h-12 mr-4"
              />
              <div>
                <h3 className="font-bold">{badge.name}</h3>
                <div className="text-sm text-muted-foreground">{badge.type}</div>
              </div>
            </div>
            <p className="text-sm mb-4">{badge.description}</p>
            <div className="text-sm mb-2">
              <span className="font-semibold">XP Points:</span> {badge.xpPoints}
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleEdit(badge)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Badge</DialogTitle>
            <DialogDescription>
              Make changes to the badge. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="imageUrl" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="xpPoints" className="text-right">
                  XP Points
                </Label>
                <Input
                  id="xpPoints"
                  name="xpPoints"
                  type="number"
                  value={formData.xpPoints}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={formData.type || ''} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a badge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="course_completion">Course Completion</SelectItem>
                    <SelectItem value="area_completion">Area Completion</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={updateBadgeMutation.isPending}>
                {updateBadgeMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Badge</DialogTitle>
            <DialogDescription>
              Fill in the details for the new badge.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCreate}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="create-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-description" className="text-right">
                  Description
                </Label>
                <Input
                  id="create-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-imageUrl" className="text-right">
                  Image URL
                </Label>
                <Input
                  id="create-imageUrl"
                  name="imageUrl"
                  value={formData.imageUrl || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-xpPoints" className="text-right">
                  XP Points
                </Label>
                <Input
                  id="create-xpPoints"
                  name="xpPoints"
                  type="number"
                  value={formData.xpPoints}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="create-type" className="text-right">
                  Type
                </Label>
                <Select 
                  value={formData.type || ''} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a badge type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assessment">Assessment</SelectItem>
                    <SelectItem value="course_completion">Course Completion</SelectItem>
                    <SelectItem value="area_completion">Area Completion</SelectItem>
                    <SelectItem value="special">Special</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createBadgeMutation.isPending}>
                {createBadgeMutation.isPending ? "Creating..." : "Create Badge"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}