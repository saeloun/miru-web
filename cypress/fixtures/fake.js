import  faker  from 'faker';
export let fake = {};

function firstName() {
  return faker.name.firstName();
}

function lastName() {
  return faker.name.lastName();
}

function email() {
  return faker.internet.email();
}

Object.defineProperty(fake, "firstName", { get: firstName });
Object.defineProperty(fake, "lastName", { get: lastName });
Object.defineProperty(fake, "email", { get: email });
