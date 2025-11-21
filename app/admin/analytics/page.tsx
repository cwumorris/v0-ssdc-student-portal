"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (!storedUserId) {
      router.push("/admin/login")
      return
    }
    setUserId(storedUserId)
    fetchStats(storedUserId)
  }, [router])

  const fetchStats = async (uid: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/stats?userId=${uid}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error("[v0] Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculatePercentage = (value: number, total: number) => {
    if (total === 0) return 0
    return ((value / total) * 100).toFixed(1)
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Analytics & Statistics</h2>
          <p className="text-muted-foreground">Overview of platform metrics and trends</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p>Loading statistics...</p>
          </div>
        ) : stats ? (
          <>
            {/* Students Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Student Statistics</CardTitle>
                <CardDescription>Verification status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="text-3xl font-bold">{stats.students.total}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Verified</p>
                    <p className="text-3xl font-bold text-green-600">{stats.students.verified}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.students.verified, stats.students.total)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.students.pending}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.students.pending, stats.students.total)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Under Review</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.students.underReview}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.students.underReview, stats.students.total)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Rejected</p>
                    <p className="text-3xl font-bold text-red-600">{stats.students.rejected}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.students.rejected, stats.students.total)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Verified</span>
                      <span>{calculatePercentage(stats.students.verified, stats.students.total)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${calculatePercentage(stats.students.verified, stats.students.total)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pending Review</span>
                      <span>
                        {calculatePercentage(
                          stats.students.pending + stats.students.underReview,
                          stats.students.total
                        )}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-600 h-2 rounded-full"
                        style={{
                          width: `${calculatePercentage(
                            stats.students.pending + stats.students.underReview,
                            stats.students.total
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vendors Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Statistics</CardTitle>
                <CardDescription>Approval status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Vendors</p>
                    <p className="text-3xl font-bold">{stats.vendors.total}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Approved</p>
                    <p className="text-3xl font-bold text-green-600">{stats.vendors.approved}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.vendors.approved, stats.vendors.total)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.vendors.pending}</p>
                    <p className="text-xs text-muted-foreground">
                      {calculatePercentage(stats.vendors.pending, stats.vendors.total)}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Approval Rate</span>
                    <span>{calculatePercentage(stats.vendors.approved, stats.vendors.total)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${calculatePercentage(stats.vendors.approved, stats.vendors.total)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Verification Rate</CardDescription>
                  <CardTitle className="text-2xl">
                    {stats.students.total > 0
                      ? calculatePercentage(stats.students.verified, stats.students.total)
                      : 0}
                    %
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending Actions</CardDescription>
                  <CardTitle className="text-2xl">
                    {stats.students.pending + stats.students.underReview + stats.vendors.pending}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Users</CardDescription>
                  <CardTitle className="text-2xl">
                    {stats.students.total + stats.vendors.total}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No statistics available
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

