"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { Vendor } from "@/lib/types"

export default function VendorsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  })

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (!storedUserId) {
      router.push("/admin/login")
      return
    }
    setUserId(storedUserId)
    fetchVendors(storedUserId)
  }, [router])

  const fetchVendors = async (uid: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/vendors?userId=${uid}`)
      if (response.ok) {
        const data = await response.json()
        setVendors(data.vendors || [])
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch vendors' }))
        toast.error(errorData.error || "Failed to fetch vendors")
        setVendors([])
      }
    } catch (error) {
      console.error("[v0] Error fetching vendors:", error)
      toast.error("Failed to fetch vendors")
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleVendorAction = async (vendorId: string, action: "approve" | "reject" | "suspend", reason?: string) => {
    if (!userId) return

    try {
      const response = await fetch("/api/admin/vendors/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, vendorId, action, reason }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || `Vendor ${action}d successfully`)
        fetchVendors(userId)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Action failed' }))
        toast.error(errorData.error || "Action failed")
      }
    } catch (error) {
      console.error("[v0] Vendor action error:", error)
      toast.error("Action failed. Please try again.")
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    if (filters.status !== "all" && vendor.approval_status !== filters.status) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        vendor.business_name.toLowerCase().includes(searchLower) ||
        vendor.business_email.toLowerCase().includes(searchLower) ||
        vendor.business_phone.includes(searchLower)
      )
    }
    return true
  })

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Vendor Management</h2>
            <p className="text-muted-foreground">Manage vendor registrations and approvals</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>Review and manage vendor applications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Input
                placeholder="Search vendors..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="max-w-xs"
              />
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p>Loading vendors...</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredVendors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No vendors found
                  </div>
                ) : (
                  filteredVendors.map((vendor) => (
                    <Card key={vendor.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                              <Badge
                                variant={
                                  vendor.approval_status === "approved"
                                    ? "default"
                                    : vendor.approval_status === "rejected"
                                      ? "destructive"
                                      : vendor.approval_status === "suspended"
                                        ? "secondary"
                                        : "secondary"
                                }
                              >
                                {vendor.approval_status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                              <p>Email: {vendor.business_email}</p>
                              <p>Phone: {vendor.business_phone}</p>
                              {vendor.business_registration_number && (
                                <p>Reg. No: {vendor.business_registration_number}</p>
                              )}
                              {vendor.business_address && <p>Address: {vendor.business_address}</p>}
                            </div>
                            {vendor.api_key && (
                              <div className="text-xs text-muted-foreground">
                                <p>API Key: {vendor.api_key.substring(0, 20)}...</p>
                                <p>API Calls: {vendor.api_calls_count} / {vendor.api_calls_limit}</p>
                              </div>
                            )}
                            {vendor.rejection_reason && (
                              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                                Rejection Reason: {vendor.rejection_reason}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedVendor(vendor)
                                setIsDetailModalOpen(true)
                              }}
                            >
                              View Details
                            </Button>
                            {vendor.approval_status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleVendorAction(vendor.id, "approve")}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    const reason = prompt("Rejection reason:")
                                    if (reason) handleVendorAction(vendor.id, "reject", reason)
                                  }}
                                >
                                  Reject
                                </Button>
                              </>
                            )}
                            {vendor.approval_status === "approved" && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const confirmed = confirm("Are you sure you want to suspend this vendor?")
                                  if (confirmed) handleVendorAction(vendor.id, "suspend", "Suspended by admin")
                                }}
                              >
                                Suspend
                              </Button>
                            )}
                            {vendor.approval_status === "suspended" && (
                              <Button
                                size="sm"
                                onClick={() => handleVendorAction(vendor.id, "approve")}
                              >
                                Reactivate
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor Detail Modal */}
      {isDetailModalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedVendor.business_name}</CardTitle>
                <CardDescription>Vendor Profile Details</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedVendor(null)
                }}
              >
                ×
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="font-semibold">Status:</span>
                <Badge
                  variant={
                    selectedVendor.approval_status === "approved"
                      ? "default"
                      : selectedVendor.approval_status === "rejected"
                        ? "destructive"
                        : selectedVendor.approval_status === "suspended"
                          ? "secondary"
                          : "secondary"
                  }
                >
                  {selectedVendor.approval_status}
                </Badge>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Business Name</p>
                    <p className="font-medium">{selectedVendor.business_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Business Email</p>
                    <p className="font-medium">{selectedVendor.business_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Business Phone</p>
                    <p className="font-medium">{selectedVendor.business_phone}</p>
                  </div>
                  {selectedVendor.business_registration_number && (
                    <div>
                      <p className="text-sm text-muted-foreground">Registration Number</p>
                      <p className="font-medium">{selectedVendor.business_registration_number}</p>
                    </div>
                  )}
                  {selectedVendor.business_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Business Address</p>
                      <p className="font-medium">{selectedVendor.business_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* API Information */}
              {selectedVendor.api_key && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">API Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">API Key</p>
                      <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                        {selectedVendor.api_key}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">API Calls Count</p>
                        <p className="font-medium">{selectedVendor.api_calls_count || 0}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">API Calls Limit</p>
                        <p className="font-medium">{selectedVendor.api_calls_limit || 1000}</p>
                      </div>
                    </div>
                    {selectedVendor.api_key_created_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">API Key Created At</p>
                        <p className="font-medium">
                          {new Date(selectedVendor.api_key_created_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Approval Information */}
              {(selectedVendor.approved_by || selectedVendor.approved_at) && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Approval Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedVendor.approved_at && (
                      <div>
                        <p className="text-sm text-muted-foreground">Approved At</p>
                        <p className="font-medium">
                          {new Date(selectedVendor.approved_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {selectedVendor.rejection_reason && (
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-destructive">Rejection Information</h3>
                  <div className="bg-destructive/10 p-3 rounded">
                    <p className="text-sm text-muted-foreground mb-1">Rejection Reason</p>
                    <p className="font-medium text-destructive">{selectedVendor.rejection_reason}</p>
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Uploaded Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedVendor.business_certificate_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Business Certificate</p>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={selectedVendor.business_certificate_url}
                          alt="Business Certificate"
                          className="w-full h-64 object-contain bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const link = document.createElement('a')
                              link.href = selectedVendor.business_certificate_url
                              link.textContent = 'View Certificate (Click to open)'
                              link.target = '_blank'
                              link.className = 'text-blue-600 hover:underline p-4 block'
                              parent.appendChild(link)
                            }
                          }}
                        />
                      </div>
                      <a
                        href={selectedVendor.business_certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Full Size
                      </a>
                    </div>
                  )}
                  {selectedVendor.business_license_url && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Business License</p>
                      <div className="border rounded-lg overflow-hidden">
                        <img
                          src={selectedVendor.business_license_url}
                          alt="Business License"
                          className="w-full h-64 object-contain bg-muted"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent) {
                              const link = document.createElement('a')
                              link.href = selectedVendor.business_license_url || ''
                              link.textContent = 'View License (Click to open)'
                              link.target = '_blank'
                              link.className = 'text-blue-600 hover:underline p-4 block'
                              parent.appendChild(link)
                            }
                          }}
                        />
                      </div>
                      <a
                        href={selectedVendor.business_license_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Full Size
                      </a>
                    </div>
                  )}
                  {!selectedVendor.business_certificate_url && !selectedVendor.business_license_url && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      No documents uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Timestamps</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Registered At</p>
                    <p className="font-medium">
                      {selectedVendor.created_at
                        ? new Date(selectedVendor.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {selectedVendor.updated_at
                        ? new Date(selectedVendor.updated_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedVendor.approval_status === "pending" && (
                  <>
                    <Button
                      onClick={() => {
                        setIsDetailModalOpen(false)
                        handleVendorAction(selectedVendor.id, "approve")
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        const reason = prompt("Rejection reason:")
                        if (reason) {
                          setIsDetailModalOpen(false)
                          handleVendorAction(selectedVendor.id, "reject", reason)
                        }
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedVendor.approval_status === "approved" && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const confirmed = confirm("Are you sure you want to suspend this vendor?")
                      if (confirmed) {
                        setIsDetailModalOpen(false)
                        handleVendorAction(selectedVendor.id, "suspend", "Suspended by admin")
                      }
                    }}
                  >
                    Suspend
                  </Button>
                )}
                {selectedVendor.approval_status === "suspended" && (
                  <Button
                    onClick={() => {
                      setIsDetailModalOpen(false)
                      handleVendorAction(selectedVendor.id, "approve")
                    }}
                  >
                    Reactivate
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDetailModalOpen(false)
                    setSelectedVendor(null)
                  }}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  )
}

