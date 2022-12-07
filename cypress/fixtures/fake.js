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
function invoiceNumber() {
  return faker.random.alphaNumeric(5);
}

function invalidReference(){
  return faker.random.alphaNumeric(13)
}
function validReference(){
  return faker.random.alphaNumeric(6)
}
function clientName(){
  return faker.company.companyName();
}

function address(){
  return faker.address.city();
}

function phoneNumber(){
  return faker.phone.phoneNumber()
}

Object.defineProperty(fake, "firstName", { get: firstName });
Object.defineProperty(fake, "lastName", { get: lastName });
Object.defineProperty(fake, "email", { get: email });
Object.defineProperty(fake,'invoiceNumber',{get: invoiceNumber});
Object.defineProperty(fake,'invalidReference',{get: invalidReference});
Object.defineProperty(fake,'validReference',{get: validReference});
Object.defineProperty(fake, "clientName", { get: clientName });
Object.defineProperty(fake, "address", { get: address });
Object.defineProperty(fake, "phoneNumber", { get: phoneNumber });
