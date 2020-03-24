public with sharing class ContactController {

    @AuraEnabled(cacheable=true)
    public static List<Contact> getContactList() {

        List<Contact> contacts = [SELECT Id, Name, Email, Contact_Level__c, AccountId, Account.Name, OwnerId, Owner.Name, CreatedById, CreatedBy.Name, CreatedDate FROM Contact];

        return contacts;
    }
}
