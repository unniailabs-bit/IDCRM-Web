import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Copy, Link as LinkIcon, Plus, ExternalLink, CheckCircle, Loader2 } from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import { toast } from "sonner";

interface FormLink {
  id: number;
  token: string;
  class_name: string;
  division: string;
  full_url: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

interface Division {
  class_name: string;
  division_name: string;
}

export function FormLinkManager() {
  const [formLinks, setFormLinks] = useState<FormLink[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchFormLinks();
  }, []);

  const fetchFormLinks = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/form-links/my-links");
      if (response.data.success) {
        setFormLinks(response.data.data.links || []);
        setDivisions(response.data.data.divisions || []);
      }
    } catch (error) {
      console.error("Error fetching form links:", error);
      toast.error("Failed to fetch form links");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Create a map of existing links by class-division
  const linkMap = new Map(
    formLinks.map((link) => [`${link.class_name}-${link.division}`, link])
  );

  // Merge divisions with their links
  const divisionsWithLinks = divisions.map((div) => {
    const key = `${div.class_name}-${div.division_name}`;
    return {
      class_name: div.class_name,
      division_name: div.division_name,
      link: linkMap.get(key) || null,
    };
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading form links...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Your Class Form Links</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Share these links with students to submit their registration forms
          </p>
        </CardHeader>
        <CardContent>
          {divisionsWithLinks.length === 0 ? (
            <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
              <p className="font-semibold text-gray-900">No classes assigned to you</p>
              <p className="text-sm mt-2 text-gray-700">
                Please contact your school admin to assign classes/divisions to your account.
              </p>
              <p className="text-xs mt-2 text-gray-600">
                Once classes are assigned, form links will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {divisionsWithLinks.map((item, index) => {
                const hasLink = item.link !== null;
                const linkToken = item.link?.token || "";
                const linkUrl = item.link?.full_url || "";

                return (
                  <div
                    key={index}
                    className="border rounded-lg p-4 mb-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-gray-900 font-semibold">
                        {item.class_name} - {item.division_name}
                      </h3>
                      {hasLink && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Active
                        </span>
                      )}
                    </div>
                    {hasLink ? (
                      <>
                        <div className="bg-gray-100 p-3 rounded border mb-3">
                          <p className="text-sm text-gray-900 break-all">
                            {linkUrl}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyLink(linkUrl, linkToken)}
                            className="flex items-center gap-2"
                          >
                            {copiedToken === linkToken ? (
                              <>
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(linkUrl, "_blank")}
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        Link will be auto-generated when you refresh this page
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

