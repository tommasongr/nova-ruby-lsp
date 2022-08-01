require "set"
require "pathname"


class Person
  extend T::Sig

  sig { void }
  def initialize
    @age = T.let(0, Integer)
  end

  sig { void }
  def age!
  @age += 1
  end
end

person = Person.new
person.age!
