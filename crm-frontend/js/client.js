export default class Client {
    constructor(id, surname, name, lastName, createdAt, updatedAt, contacts) {
        this.id = id
        this.surname = surname
        this.name = name
        this.lastName = lastName
        this.createdAt = new Date(createdAt)
        this.updatedAt = new Date(updatedAt)
        this.contacts = contacts
    }

    get fio() {
        return `${this.surname} ${this.name} ${this.lastName}`
    }

    
}