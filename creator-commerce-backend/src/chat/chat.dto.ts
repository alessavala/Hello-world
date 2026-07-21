import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class StartConversationDto {
  // The OTHER party's profile id: a creatorId when the caller is a BRAND,
  // a brandId when the caller is a CREATOR. Which one it means is resolved
  // server-side from the caller's own role - never trusted from the client.
  @IsString() counterpartId: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body: string;
}
