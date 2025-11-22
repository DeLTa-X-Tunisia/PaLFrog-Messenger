export declare enum Visibility {
    PUBLIC = "PUBLIC",
    CONTACTS = "CONTACTS",
    PRIVATE = "PRIVATE"
}
export declare class UpdateProfileDto {
    firstName?: string;
    lastName?: string;
    country?: string;
    profession?: string;
    maritalStatus?: string;
    phoneNumber?: string;
    bio?: string;
    avatarUrl?: string;
    firstNameVisibility?: Visibility;
    lastNameVisibility?: Visibility;
    countryVisibility?: Visibility;
    professionVisibility?: Visibility;
    maritalStatusVisibility?: Visibility;
    birthDateVisibility?: Visibility;
    genderVisibility?: Visibility;
    emailVisibility?: Visibility;
    phoneNumberVisibility?: Visibility;
}
