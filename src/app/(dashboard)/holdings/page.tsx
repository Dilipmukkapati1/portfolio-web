"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MOCK_HOLDINGS = [
  { symbol: "VTI", qty: 120, price: 245.3, value: 29436 },
  { symbol: "AAPL", qty: 50, price: 189.2, value: 9460 },
  { symbol: "MSFT", qty: 30, price: 415.8, value: 12474 },
];

export default function HoldingsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader title="Holdings" description="Investment positions" />
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_HOLDINGS.map((h) => (
              <TableRow key={h.symbol}>
                <TableCell className="font-medium">{h.symbol}</TableCell>
                <TableCell className="text-right">{h.qty}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(h.price)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(h.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </motion.div>
  );
}
