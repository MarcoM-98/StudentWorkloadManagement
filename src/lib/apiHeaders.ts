export function withFirebaseUserHeaders(
  userId: string,
  headers: HeadersInit = {}
): HeadersInit {
  return {
    ...headers,
    "x-firebase-uid": userId,
  };
}
