import { faker } from "@faker-js/faker"
import { User } from "./schema"

const generateUsers = () => {
  return Array.from({ length: 30 }, () => {
    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const createdAt = faker.date.past()
    const updatedAt = faker.date.between({ from: createdAt, to: new Date() })
    const guarantorCount = faker.number.int({ min: 0, max: 2 })
    const guarantors =
      guarantorCount === 0
        ? []
        : Array.from({ length: guarantorCount }, () => {
            const gFirst = faker.person.firstName()
            const gLast = faker.person.lastName()
            return `${gFirst} ${gLast}`
          })

    return {
      id: faker.string.alphanumeric({ length: 8, casing: "upper" }),
      firstName,
      lastName,
      propertyAddress: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
      guarantors,
      loanType: faker.helpers.arrayElement(["Fixed", "ARM", "Interest-Only"]),
      transactionType: faker.helpers.arrayElement(["Purchase", "Refinance", "Cash-Out Refi"]),
      loanAmount: faker.number.int({ min: 150000, max: 3000000 }),
      rate: faker.number.float({ min: 4, max: 12, fractionDigits: 3 }),
      assignedTo: `${faker.person.firstName()} ${faker.person.lastName()}`,
      email: faker.internet.email({ firstName }).toLocaleLowerCase(),
      phoneNumber: faker.phone.number({ style: "international" }),
      status: faker.helpers.arrayElement(["active", "dead"]),
      role: faker.helpers.arrayElement(["superadmin", "admin", "cashier", "manager"]),
      createdAt,
      updatedAt,
    } as User
  })
}

// Singleton data
let users: User[] | null = null

export const getUsers = () => {
  if (!users) {
    users = generateUsers() // Generate data once
  }
  return users
}
