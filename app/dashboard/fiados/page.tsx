import * as React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/organization";
import { prisma } from "@/lib/db";
import { CreditsPageClient } from "./_components/credits-page-client";

export const metadata = {
  title: "Fiados | Tendo",
  description: "Gestión de créditos y cuentas por cobrar",
};

async function getCredits(organizationId: string) {
  const credits = await prisma.credit.findMany({
    where: { organizationId },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          rut: true,
          email: true,
          phone: true,
          currentDebt: true,
          creditLimit: true,
        },
      },
      document: {
        select: {
          id: true,
          type: true,
          docNumber: true,
          docPrefix: true,
          total: true,
          issuedAt: true,
        },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paidAt: true,
        },
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });

  return credits;
}

async function getCustomers(organizationId: string) {
  const customers = await prisma.customer.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      rut: true,
      currentDebt: true,
      creditLimit: true,
    },
    orderBy: { name: "asc" },
  });

  return customers;
}

export default async function FiadosPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const organizationId = await getOrganizationId(session.user.id);

  if (!organizationId) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sin Organización</h1>
          <p className="text-muted-foreground mt-2">
            No tienes una organización asignada.
          </p>
        </div>
      </div>
    );
  }

  const [credits, customers] = await Promise.all([
    getCredits(organizationId),
    getCustomers(organizationId),
  ]);

  // Serializar datos para el cliente
  const serializedCredits = credits.map((credit) => ({
    ...credit,
    amount: Number(credit.amount),
    balance: Number(credit.balance),
    createdAt: credit.createdAt.toISOString(),
    updatedAt: credit.updatedAt.toISOString(),
    dueDate: credit.dueDate.toISOString(),
    customer: {
      ...credit.customer,
      currentDebt: Number(credit.customer.currentDebt),
      creditLimit: credit.customer.creditLimit
        ? Number(credit.customer.creditLimit)
        : null,
    },
    document: credit.document
      ? {
          ...credit.document,
          total: Number(credit.document.total),
          issuedAt: credit.document.issuedAt.toISOString(),
        }
      : null,
    payments: credit.payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      paidAt: p.paidAt.toISOString(),
    })),
  }));

  const serializedCustomers = customers.map((customer) => ({
    ...customer,
    currentDebt: Number(customer.currentDebt),
    creditLimit: customer.creditLimit ? Number(customer.creditLimit) : null,
  }));

  return (
    <CreditsPageClient
      credits={serializedCredits}
      customers={serializedCustomers}
    />
  );
}
